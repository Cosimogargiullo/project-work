import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { User } from '@app/models/user.model';
import { UserService } from '@app/services/user.service';
import { AuthService } from '@app/core/auth/auth.service';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { RESULT_OK } from '@app/core/constants/api-endpoints';
import { USER_ROLES } from '@app/core/constants/user-roles';
import { AppLoggerService } from '@app/core/error/app-logger.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: User = {} as User;
  isEditing = false;
  private backupUser: User | null = null;
  loading = false;
  birthDate: Date | null = null;
  isDoctor = false;
  maxBirthDate: Date = new Date();
  specializations: string[] = ['CARDIOLOGIA', 'ORTOPEDIA', 'DERMATOLOGIA'];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog,
    private logger: AppLoggerService
  ) {}

  ngOnInit(): void {
    const roles = this.authService.getRoles();
    this.isDoctor = roles.includes(USER_ROLES.MEDICO);

    const userId = this.authService.getUserId();
    if (userId) {
      this.loading = true;
      const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

      this.userService
        .getUserById(userId)
        .pipe(
          finalize(() => {
            this.loading = false;
            spinnerRef.close();
          })
        )
        .subscribe({
          next: user => {
            this.user = user;
            this.birthDate = user.birthDate ? new Date(user.birthDate) : null;
          },
          error: err => {
            this.logger.error('ProfileComponent.loadProfile', err);
            this.dialog.open(ResultDialogModalComponent, {
              width: '400px',
              data: {
                titolo: 'Caricamento profilo non riuscito',
                messaggio:
                  err?.error?.resultMessage ||
                  'Si è verificato un errore durante il caricamento del profilo utente.'
              }
            });
          }
        });
    } else {
      sessionStorage.clear();
    }
  }

  onEdit() {
    this.isEditing = true;
    // Deep copy per backup
    this.backupUser = JSON.parse(JSON.stringify(this.user));
  }

  onSave() {
    if (!this.user || !this.user.id) {
      this.dialog.open(ResultDialogModalComponent, {
        width: '400px',
        data: {
          titolo: 'Salvataggio profilo non riuscito',
          messaggio: 'Dati utente non validi. Impossibile salvare il profilo.'
        }
      });
      return;
    }

    this.loading = true;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

    const payload = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      username: this.user.username,
      email: this.user.email,
      phone: this.user.phone,
      fiscalCode: this.user.fiscalCode,
      birthDate: this.formatBirthDate(this.birthDate),
      specialization: this.isDoctor ? this.user.specialization : undefined
    };

    this.userService
      .updateUser(this.user.id, payload)
      .pipe(
        finalize(() => {
          this.loading = false;
          spinnerRef.close();
        })
      )
      .subscribe({
        next: (res: SimpleResult) => {
          const dialogRef = this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: res.resultMessageHeader,
              messaggio: res.resultMessage
            }
          });

          dialogRef.afterClosed().subscribe(() => {
            if (res.result === RESULT_OK) {
              this.isEditing = false;
              this.backupUser = null;
            }
          });
        },
        error: err => {
          this.logger.error('ProfileComponent.saveProfile', err);
          this.dialog.open(ResultDialogModalComponent, {
            width: '400px',
            data: {
              titolo: 'Salvataggio profilo non riuscito',
              messaggio:
                err?.error?.resultMessage ||
                'Si è verificato un errore durante il salvataggio del profilo utente.'
            }
          });
        }
      });
  }

  onFiscalCodeChange(value: string): void {
    if (!this.user) {
      return;
    }
    const normalized = value.toUpperCase().slice(0, 16);
    if (normalized !== this.user.fiscalCode) {
      this.user.fiscalCode = normalized;
    }
  }

  onPhoneInput(event: Event): void {
    if (!this.user) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    if (digits !== input.value) {
      input.value = digits;
    }
    this.user.phone = digits;
  }

  formatSpecialization(value?: string | null): string {
    if (!value) {
      return '';
    }
    return value
      .toLowerCase()
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatBirthDate(date: Date | null): string | null {
    if (!date) {
      return null;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onCancel() {
    if (this.backupUser) {
      this.user = JSON.parse(JSON.stringify(this.backupUser));
    }
    this.isEditing = false;
    this.backupUser = null;
  }
}
