import { Component, OnInit, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@app/core/auth/auth.service';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { UserService } from '@app/services/user.service';
import { ReportService } from '@app/services/report.service';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { ConfirmDialogModalComponent } from '@app/utils/confirm-dialog-modal/confirm-dialog-modal.component';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { User } from '@app/models/user.model';
import { MedicalReport } from '@app/models/medical-report.model';
import { debounceTime, distinctUntilChanged, switchMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReportDialogComponent } from './report-dialog/report-dialog.component';
import { ReportsFacadeService } from './reports-facade.service';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private readonly mobileBreakpoint = 768;
  isMobileView = false;

  // tabella
  displayedColumns: string[] = ['date', 'patientName', 'doctorName', 'appointmentId', 'cost', 'actions'];
  reports: MedicalReport[] = [];
  // dati grezzi recuperati dal backend (in base al ruolo)
  filtered: MedicalReport[] = [];

  // ruolo
  isDoctor = false;
  isPatient = false;
  isAdmin = false;
  isSegreteria = false;

  // filtri
  patientSearchControl = new FormControl<string | null>('');
  doctorSearchControl = new FormControl<string | null>('');
  dateControl = new FormControl<Date | null>(null);
  reportDateControl = new FormControl<Date | null>(null);
  patients: User[] = [];
  doctors: User[] = [];
  isLoadingPatients = false;
  isLoadingDoctors = false;
  selectedPatientId: number | null = null;
  selectedDoctorId: number | null = null;
  // cache nomi
  patientNames: { [id: number]: string } = {};
  doctorNames: { [id: number]: string } = {};
  // cache date appuntamenti
  appointmentDates: { [appointmentId: number]: Date | string | null } = {};

  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private userService: UserService,
    private reportService: ReportService,
    private reportsFacade: ReportsFacadeService
  ) {
    // form controls initialized above
  }

  ngOnInit(): void {
    this.updateViewportMode();

    const roles = this.authService.getRoles();
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);
    this.isPatient = roles.includes(USER_ROLES.PAZIENTE);
    this.isAdmin = roles.includes(USER_ROLES.ADMIN);
    this.isSegreteria = roles.includes(USER_ROLES.SEGRETERIA);
    this.displayedColumns = this.getDisplayedColumnsByRole();

    this.setupPatientSearch();
    this.setupDoctorSearch();
    this.setupDateControls();
    this.findAll();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
  }

  private updateViewportMode(): void {
    this.isMobileView = window.innerWidth < this.mobileBreakpoint;
  }

  private getDisplayedColumnsByRole(): string[] {
    let columns: string[] = ['date', 'patientName', 'doctorName', 'appointmentId', 'cost', 'actions'];
    if (this.isPatient) {
      columns = columns.filter((column) => column !== 'patientName');
    }
    if (this.isDoctor) {
      columns = columns.filter((column) => column !== 'doctorName');
    }
    return columns;
  }

  get canManageReports(): boolean {
    return this.isDoctor || this.isAdmin || this.isSegreteria;
  }

  private setupDateControls(): void {
    this.dateControl.valueChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged((a: Date | null, b: Date | null) => {
          const ta = a instanceof Date ? a.getTime() : null;
          const tb = b instanceof Date ? b.getTime() : null;
          return ta === tb;
        })
      )
      .subscribe(() => this.loadReports());

    this.reportDateControl.valueChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged((a: Date | null, b: Date | null) => {
          const ta = a instanceof Date ? a.getTime() : null;
          const tb = b instanceof Date ? b.getTime() : null;
          return ta === tb;
        })
      )
      .subscribe(() => this.loadReports());
  }

  private setupDoctorSearch(): void {
    this.doctorSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string | null) => {
          const term = (value || '').trim();
          this.selectedDoctorId = null;
          return this.userService.searchDoctors(term).pipe(
            catchError(() => of([]))
          );
        })
      )
      .subscribe((doctors: User[]) => {
        this.doctors = doctors || [];
        this.loadReports();
      });
  }

  private findAll(): void {
    const roles = this.authService.getRoles();
    const userId = this.authService.getUserId();
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    this.reportsFacade.loadByRole(roles, userId).subscribe({
      next: (reports) => {
        this.filtered = reports || [];
        spinnerRef.close();
        this.loadReports();
      },
      error: () => {
        this.filtered = [];
        this.reports = [];
        spinnerRef.close();
      }
    });
  }

  private setupPatientSearch(): void {
    this.patientSearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string | null) => {
          const term = (value || '').trim();
          this.selectedPatientId = null;
          return this.userService.searchPatients(term).pipe(
            catchError(() => of([]))
          );
        })
      )
      .subscribe((patients: User[]) => {
        this.patients = patients || [];
        this.loadReports();
      });
  }

  onPatientSelected(user: User): void {
    if (!user || user.id == null) {
      return;
    }
    this.selectedPatientId = user.id;
    this.patientSearchControl.setValue(`${user.firstName} ${user.lastName}`, { emitEvent: false });
    this.loadReports();
  }

  onDoctorSelected(user: User): void {
    if (!user || user.id == null) {
      return;
    }
    this.selectedDoctorId = user.id;
    this.doctorSearchControl.setValue(`${user.firstName} ${user.lastName}`, { emitEvent: false });
    this.loadReports();
  }

  displayPatient(user: User | string | null): string {
    if (!user || typeof user === 'string') {
      return typeof user === 'string' ? user : '';
    }
    return `${user.firstName} ${user.lastName} (${user.username})`;
  }

  displayDoctor(user: User | string | null): string {
    return this.displayPatient(user);
  }

  private loadReports(): void {
    const roles = this.authService.getRoles();
    const userId = this.authService.getUserId();
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    const visibleReports = this.reportsFacade.applyRoleVisibility([...this.filtered], roles, userId);

    this.reportsFacade.enrichReports(visibleReports).subscribe((enriched) => {
      this.patientNames = enriched.patientNames;
      this.doctorNames = enriched.doctorNames;
      this.appointmentDates = enriched.appointmentDates;

      this.reports = this.reportsFacade.applyFilters(
        visibleReports,
        {
          selectedPatientId: this.selectedPatientId,
          selectedDoctorId: this.selectedDoctorId,
          patientTerm: (this.patientSearchControl?.value || '').toString().trim(),
          doctorTerm: (this.doctorSearchControl?.value || '').toString().trim(),
          appointmentDate: this.dateControl?.value || null,
          reportDate: this.reportDateControl?.value || null
        },
        this.patientNames,
        this.doctorNames,
        this.appointmentDates
      );

      spinnerRef.close();
    });
  }

  resetFilters(): void {
    this.patientSearchControl.setValue('', { emitEvent: false });
    this.selectedPatientId = null;
    this.doctorSearchControl.setValue('', { emitEvent: false });
    this.selectedDoctorId = null;
    this.dateControl.setValue(null, { emitEvent: false });
    this.reportDateControl.setValue(null, { emitEvent: false });
    this.loadReports();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '520px',
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.findAll();
      }
    });
  }

  download(report: MedicalReport): void {
    if (!report || report.id == null) {
      return;
    }

    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    this.reportService.downloadFile(report.id).subscribe({
      next: (blob) => {
        spinnerRef.close();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.fileName || 'referto.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        spinnerRef.close();
        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Download non riuscito',
            messaggio: 'Errore durante il download del referto.'
          }
        });
      }
    });
  }

   view(report: MedicalReport): void {
    if (!report || report.id == null) {
      return;
    }

    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    this.reportService.downloadFile(report.id).subscribe({
      next: (blob) => {
        spinnerRef.close();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        spinnerRef.close();
        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Visualizzazione non riuscita',
            messaggio: 'Errore durante il caricamento del referto.'
          }
        });
      }
    });
  }

  deleteReport(report: MedicalReport): void {
    if (!report || report.id == null) {
      return;
    }

    const confirmRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma eliminazione referto',
        messaggio: 'Sei sicuro di voler eliminare questo referto?',
        confirmLabel: 'Elimina',
        cancelLabel: 'Annulla'
      }
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

      this.reportService.delete(report.id as number).subscribe({
        next: (res: SimpleResult) => {
          spinnerRef.close();
          const resultDialogRef = this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: res.resultMessageHeader,
              messaggio: res.resultMessage
            }
          });

          resultDialogRef.afterClosed().subscribe(() => {
            if (res.result === RESULT_OK) {
              this.findAll();
            }
          });
        },
        error: (err) => {
          spinnerRef.close();
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: 'Eliminazione non riuscita',
              messaggio: err?.error?.resultMessage || 'Errore durante l\'eliminazione del referto.'
            }
          });
        }
      });
    });
  }

  editReport(report: MedicalReport): void {
    if (!report || report.id == null) {
      return;
    }

    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '520px',
      autoFocus: true,
      restoreFocus: true,
      data: {
        mode: 'edit',
        report
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.findAll();
      }
    });
  }
}
