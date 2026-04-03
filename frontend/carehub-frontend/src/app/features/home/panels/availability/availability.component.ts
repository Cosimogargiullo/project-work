import { Component, OnInit, HostListener } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AvailabilityService } from '@app/services/availability.service';
import { AvailabilityDialogComponent } from './availability-dialog/availability-dialog.component';
import { AuthService } from '@app/core/auth/auth.service';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ConfirmDialogModalComponent } from '@app/utils/confirm-dialog-modal/confirm-dialog-modal.component';
import { DIALOG_MODES } from '@app/core/constants/dialog-modes';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { AvailabilityGroup } from '@app/models/availability-group.model';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AppLoggerService } from '@app/core/error/app-logger.service';
import { AvailabilityFacadeService } from './availability-facade.service';


@Component({
  selector: 'app-availability',
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.scss'],
providers: [
  { provide: MAT_DATE_LOCALE, useValue: 'it-IT' }
]
})
export class AvailabilityComponent implements OnInit {
  private readonly mobileBreakpoint = 768;
  isMobileView = false;

  availabilities: AvailabilityGroup[] = [];
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource(this.availabilities);

  totalAvailabilities = this.availabilities.length;
  pageSize = 5;

  // Stato caricamento per progress spinner
  loading = false;

  // Ruolo corrente
  isDoctor = false;
  isSecretary = false;

  // Ricerca medico e filtro data per segreteria
  doctorSearchControl = new FormControl<string | null>('');
  dateFilterControl = new FormControl<Date | null>(null);

  today: Date = new Date();
  constructor(
    private availabilityService: AvailabilityService,
    private dialog: MatDialog,
    private authService: AuthService,
    private availabilityFacade: AvailabilityFacadeService,
    private logger: AppLoggerService
  ) {
    this.today.setHours(0, 0, 0, 0);
    this.dateFilterControl.setValue(this.today);
  }

  ngOnInit(): void {
    this.updateViewportMode();

    const roles = this.authService.getRoles();
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);
    this.isSecretary = roles.includes(USER_ROLES.SEGRETERIA) || roles.includes(USER_ROLES.ADMIN);

    if (this.isDoctor) {
      this.displayedColumns = ['date', 'actions'];
      const doctorId = this.authService.getUserId();
      if (doctorId) {
        this.loadAvailabilityForDoctor(doctorId);
      }
    } else if (this.isSecretary) {
      this.displayedColumns = ['date', 'doctorName', 'actions'];
      this.loadAllAvailabilityForAllDoctors();
    } else {
      this.displayedColumns = ['date', 'actions'];
    }

    // Setup subscriptions for filters for all roles (date filter must work also for doctors)
    this.setupFilterSubscriptions();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateViewportMode();
  }

  private updateViewportMode(): void {
    this.isMobileView = window.innerWidth < this.mobileBreakpoint;
  }

  private loadAllAvailabilityForAllDoctors(): void {
    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    this.availabilityFacade.loadAllByDate(this.dateFilterControl.value).subscribe({
      next: (groups: AvailabilityGroup[]) => {
        this.applyAvailabilityData(groups);
        this.loading = false;
        spinnerRef.close();
      },
      error: (err) => {
        this.logger.error('AvailabilityComponent.loadAllAvailabilityForAllDoctors', err);
        this.clearAvailabilityData();
        this.loading = false;
        spinnerRef.close();
      }
    });
  }

  private setupFilterSubscriptions(): void {
    if (this.isSecretary) {
      this.doctorSearchControl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.onSearchClick();
        });
    }

    this.dateFilterControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        if (this.isDoctor) {
          const doctorId = this.authService.getUserId();
          if (doctorId) {
            this.loadAvailabilityForDoctor(doctorId);
          }
        } else {
          this.onSearchClick();
        }
      });
  }

  private loadAvailabilityForDoctor(doctorId: number): void {
    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    this.availabilityFacade.loadForDoctorByDate(doctorId, this.dateFilterControl.value).subscribe({
      next: (groups: AvailabilityGroup[]) => {
        this.applyAvailabilityData(groups);
        this.loading = false;
        spinnerRef.close();
      },
      error: (err) => {
        this.logger.error('AvailabilityComponent.loadAvailabilityForDoctor', err);
        this.clearAvailabilityData();
        this.loading = false;
        spinnerRef.close();
      }
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      data: { mode: DIALOG_MODES.create }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.reloadCurrentAvailability();
      }
    });
  }

  editAvailability(group: AvailabilityGroup): void {
    if (!group) {
      return;
    }

    const dialogRef = this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      data: {
        mode: DIALOG_MODES.edit,
        doctorId: group.doctorId,
        doctorName: group.doctorName,
        date: group.date,
        slots: group.slots
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.reloadCurrentAvailability();
      }
    });
  }

  viewAvailability(group: AvailabilityGroup): void {
    if (!group) {
      return;
    }

    this.dialog.open(AvailabilityDialogComponent, {
      width: '400px',
      autoFocus: true,
      restoreFocus: true,
      data: {
        mode: DIALOG_MODES.view,
        doctorId: group.doctorId,
        doctorName: group.doctorName,
        date: group.date,
        slots: group.slots
      }
    });
  }

  deleteAvailability(group: AvailabilityGroup): void {
    if (!group || !group.doctorId || !group.date) {
      return;
    }

    const confirmRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma eliminazione disponibilità',
        messaggio: 'Sei sicuro di voler eliminare tutti gli slot per questa data e questo medico?',
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

      this.availabilityService.deleteAvailability(group.doctorId, group.date).subscribe({
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
              this.reloadCurrentAvailability();
            }
          });
        },
        error: (err) => {
          this.loading = false;
          spinnerRef.close();
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: 'Eliminazione disponibilità non riuscita',
              messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante l\'eliminazione delle disponibilità.'
            }
          });
        }
      });
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    const startIndex = event.pageIndex * event.pageSize;
    const endIndex = startIndex + event.pageSize;
    this.dataSource.data = this.availabilities.slice(startIndex, endIndex);
  }

  onSearchClick(): void {
    const term = (this.doctorSearchControl.value || '').trim();

    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    this.availabilityFacade.loadForSearch(term, this.dateFilterControl.value).subscribe({
      next: (groups: AvailabilityGroup[]) => {
        this.applyAvailabilityData(groups);
        this.loading = false;
        spinnerRef.close();
      },
      error: (err) => {
        this.logger.error('AvailabilityComponent.onSearchClick', err);
        this.clearAvailabilityData();
        this.loading = false;
        spinnerRef.close();
      }
    });
  }

  private applyAvailabilityData(groups: AvailabilityGroup[]): void {
    this.availabilities = groups;
    this.totalAvailabilities = this.availabilities.length;
    this.dataSource.data = this.availabilities.slice(0, this.pageSize);
  }

  private clearAvailabilityData(): void {
    this.applyAvailabilityData([]);
  }

  private reloadCurrentAvailability(): void {
    if (this.isDoctor) {
      const doctorId = this.authService.getUserId();
      if (doctorId) {
        this.loadAvailabilityForDoctor(doctorId);
      }
    } else if (this.isSecretary) {
      this.onSearchClick();
    }
  }

  resetFilters(): void {
    if (this.isSecretary) {
      this.doctorSearchControl.setValue('', { emitEvent: false });
    }

    // reset date to today for all roles
    this.dateFilterControl.setValue(this.today, { emitEvent: false });
    this.reloadCurrentAvailability();
  }
}
