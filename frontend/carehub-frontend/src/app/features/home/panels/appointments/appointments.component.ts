import { Component, OnInit, HostListener } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppointmentService } from '@app/services/appointment.service';
import { AuthService } from '@app/core/auth/auth.service';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { ConfirmDialogModalComponent } from '@app/utils/confirm-dialog-modal/confirm-dialog-modal.component';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { AppointmentDialogComponent } from './appointment-dialog/appointment-dialog.component';
import { Appointment } from '@app/models/appointment.model';
import { DIALOG_MODES } from '@app/core/constants/dialog-modes';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { AppointmentsFacadeService } from './appointments-facade.service';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent implements OnInit {
  private readonly mobileBreakpoint = 768;
  isMobileView = false;

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Appointment>([]);

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];

  totalAppointments = 0;
  pageSize = 5;
  loading = false;

  isDoctor = false;
  isSecretary = false;
  isPatient = false;

  doctorSearchControl = new FormControl<string | null>('');
  patientSearchControl = new FormControl<string | null>('');
  dateFilterControl = new FormControl<Date | null>(null);
  statusControl = new FormControl<string | null>('all');
  statuses: string[] = [];
  today: Date = new Date();

  constructor(
    private appointmentService: AppointmentService,
    private dialog: MatDialog,
    private authService: AuthService,
    private appointmentsFacade: AppointmentsFacadeService
  ) {
    this.today.setHours(0, 0, 0, 0);
  }

  ngOnInit(): void {
    this.updateViewportMode();

    const roles = this.authService.getRoles();
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);
    this.isSecretary = roles.includes(USER_ROLES.SEGRETERIA) || roles.includes(USER_ROLES.ADMIN);
    this.isPatient = roles.includes(USER_ROLES.PAZIENTE);

    if (this.isSecretary) {
      this.displayedColumns = ['date', 'doctorName', 'patientName', 'status', 'actions'];
    } else if (this.isDoctor) {
      this.displayedColumns = ['date', 'patientName', 'status', 'actions'];
    } else if (this.isPatient) {
      this.displayedColumns = ['date', 'doctorName', 'status', 'actions'];
    } else {
      this.displayedColumns = ['date', 'doctorName', 'status', 'actions'];
    }

    this.setupFilterSubscriptions();

    // load appointment statuses for filter
    this.appointmentService.getStatuses().subscribe({
      next: (s) => this.statuses = s || [],
      error: () => this.statuses = []
    });

    // Carichiamo gli appuntamenti in base al ruolo:
    // - paziente: solo i propri
    // - medici: filtrati lato client sui propri
    // - segreteria/admin: tutti
    this.loadAppointments();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
  }

  private updateViewportMode(): void {
    this.isMobileView = window.innerWidth < this.mobileBreakpoint;
  }

  private loadAppointments(): void {
    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    const currentUserId = this.authService.getUserId();

    this.appointmentsFacade.loadBaseAppointments(this.isPatient, currentUserId).subscribe({
      next: (appointments: Appointment[]) => {
        this.appointmentsFacade.enrichAppointments(appointments).subscribe({
          next: (enriched: Appointment[]) => {
            this.appointments = enriched;
            this.updateFilteredAppointments();
            this.loading = false;
            spinnerRef.close();
          },
          error: () => {
            this.appointments = [];
            this.updateFilteredAppointments();
            this.loading = false;
            spinnerRef.close();
          }
        });
      },
      error: () => {
        this.loading = false;
        spinnerRef.close();
        this.appointments = [];
        this.updateFilteredAppointments();
      }
    });
  }

  private setupFilterSubscriptions(): void {
    this.doctorSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.updateFilteredAppointments());

    this.patientSearchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.updateFilteredAppointments());

    this.dateFilterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.updateFilteredAppointments());

    this.statusControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe(() => this.updateFilteredAppointments());
  }

  private updateFilteredAppointments(): void {
    const filtered = this.appointmentsFacade.applyFilters(this.appointments, {
      doctorTerm: (this.doctorSearchControl.value || '').trim().toLowerCase(),
      patientTerm: (this.patientSearchControl.value || '').trim().toLowerCase(),
      selectedDate: this.dateFilterControl.value,
      selectedStatus: this.statusControl.value,
      isDoctor: this.isDoctor,
      currentDoctorId: this.authService.getUserId()
    });

    this.filteredAppointments = filtered;
    this.totalAppointments = filtered.length;
    this.dataSource.data = filtered.slice(0, this.pageSize);
  }

  resetFilters(): void {
    this.doctorSearchControl.setValue('', { emitEvent: false });
    this.patientSearchControl.setValue('', { emitEvent: false });
    this.dateFilterControl.setValue(null, { emitEvent: false });
    this.statusControl.setValue('all', { emitEvent: false });
    this.updateFilteredAppointments();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.dataSource.data = this.filteredAppointments.slice(startIndex, endIndex);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      data: {
        mode: DIALOG_MODES.create
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAppointments();
      }
    });
  }

  openViewDialog(appointment: Appointment): void {
    if (!appointment) {
      return;
    }
    const id = appointment.id;
    if (!id) {
      return;
    }

    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    this.appointmentService.getById(id).subscribe({
      next: (fresh: Appointment) => {
        spinnerRef.close();

        this.dialog.open(AppointmentDialogComponent, {
          width: '400px',
          autoFocus: true,
          restoreFocus: true,
          data: {
            mode: DIALOG_MODES.view,
            appointment: fresh
          }
        });
      },
      error: (err) => {
        spinnerRef.close();
        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Caricamento appuntamento non riuscito',
            messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante il caricamento dell\'appuntamento.'
          }
        });
      }
    });
  }

  openEditDialog(appointment: Appointment): void {
    if (!appointment) {
      return;
    }
    const id = appointment.id;
    if (!id) {
      return;
    }

    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    this.appointmentService.getById(id).subscribe({
      next: (fresh: Appointment) => {
        spinnerRef.close();

        const dialogRef = this.dialog.open(AppointmentDialogComponent, {
          width: '400px',
          autoFocus: true,
          restoreFocus: true,
          data: {
            mode: DIALOG_MODES.edit,
            appointment: fresh
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.loadAppointments();
          }
        });
      },
      error: (err) => {
        spinnerRef.close();
        this.dialog.open(ResultDialogModalComponent, {
          width: '400px',
          data: {
            titolo: 'Caricamento appuntamento non riuscito',
            messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante il caricamento dell\'appuntamento.'
          }
        });
      }
    });
  }

  deleteAppointment(appointment: Appointment): void {
    if (!appointment || !appointment.id) {
      return;
    }
    const appointmentId = appointment.id;

    const confirmRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma eliminazione appuntamento',
        messaggio: 'Sei sicuro di voler eliminare questo appuntamento?',
        confirmLabel: 'Elimina',
        cancelLabel: 'Annulla'
      }
    });

    confirmRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      this.loading = true;
      const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

      this.appointmentService.delete(appointmentId).subscribe({
        next: (res: SimpleResult) => {
          this.loading = false;
          spinnerRef.close();

          const dialogRef = this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: res.resultMessageHeader,
              messaggio: res.resultMessage
            }
          });

          dialogRef.afterClosed().subscribe(() => {
            if (res.result === RESULT_OK) {
              this.loadAppointments();
            }
          });
        },
        error: (err) => {
          this.loading = false;
          spinnerRef.close();
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: 'Eliminazione appuntamento non riuscita',
              messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante l\'eliminazione dell\'appuntamento.'
            }
          });
        }
      });
    });
  }
}
