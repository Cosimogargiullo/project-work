import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthApiService } from '@app/features/auth/service/auth-api.service';
import { UserService } from '@app/services/user.service';
import { USER_ROLES, ALL_USER_ROLES } from '@app/core/constants/user-roles';
import { RegisterUserPayload, UpdateUserPayload, User } from '@app/models/user.model';
import { ProgressSpinnerComponent } from '@app/utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { RESULT_OK } from '@app/core/constants/api-endpoints';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordsMismatch: true };
}

function toUppercase(control: AbstractControl): void {
  const v = control.value;
  if (typeof v !== 'string') return;
  const up = v.toUpperCase();
  if (v !== up) control.setValue(up, { emitEvent: false });
}

type DialogMode = 'create' | 'edit';
type UserDialogData = { mode: DialogMode; user?: User };

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss']
})
export class UserDialogComponent implements OnInit {
  mode: DialogMode = 'create';
  form: FormGroup;
  spinnerRef: MatDialogRef<ProgressSpinnerComponent> | null = null;

  readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  readonly fiscalCodePattern = /^[A-Z0-9]{16}$/;
  readonly phonePattern = /^[0-9+()\-\s]{7,20}$/;
  readonly roles = ALL_USER_ROLES;
  readonly USER_ROLES = USER_ROLES;
  specializations: string[] = ['CARDIOLOGIA', 'ORTOPEDIA', 'DERMATOLOGIA'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    private dialog: MatDialog,
    private authApi: AuthApiService,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {
    this.form = this.fb.group(
      {
        username: ['', Validators.required],
        firstName: [''],
        lastName: [''],
        fiscalCode: ['', [Validators.required, Validators.pattern(this.fiscalCodePattern)]],
        birthDate: [null],
        email: ['', [Validators.pattern(this.emailPattern)]],
        phone: ['', [Validators.pattern(this.phonePattern)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', Validators.required],
        roles: [USER_ROLES.PAZIENTE, Validators.required],
        specialization: [null]
      },
      { validators: [passwordsMatch] }
    );
  }

  ngOnInit(): void {
    this.mode = this.data?.mode ?? 'create';

    this.form.controls['fiscalCode'].valueChanges.subscribe(() => toUppercase(this.form.controls['fiscalCode']));

    // Quando cambia il ruolo, abilitiamo/disabilitiamo la specializzazione
    this.form.get('roles')?.valueChanges.subscribe((r) => {
      const specCtrl = this.form.get('specialization');
      if (r === USER_ROLES.MEDICO) {
        specCtrl?.setValidators([Validators.required]);
      } else {
        specCtrl?.clearValidators();
        specCtrl?.setValue(null, { emitEvent: false });
      }
      specCtrl?.updateValueAndValidity({ emitEvent: false });
    });

    if (this.mode === 'edit' && this.data?.user) {
      this.populateForEdit(this.data.user);
    }
  }

  private populateForEdit(user: User): void {
    this.form.patchValue({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fiscalCode: (user.fiscalCode || '').toUpperCase(),
      birthDate: user.birthDate ? new Date(user.birthDate) : null,
      email: user.email,
      phone: user.phone || '',
      roles: user.roles && user.roles.length ? user.roles[0] : USER_ROLES.PAZIENTE,
      specialization: user.specialization || null
    });

    // In edit nascondiamo i campi password e rimuoviamo i validatori
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('confirm')?.clearValidators();
    this.form.get('confirm')?.updateValueAndValidity({ emitEvent: false });
    this.form.clearValidators();
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const values = this.form.value;
    const payload: UpdateUserPayload = {
      username: values.username,
      firstName: values.firstName,
      lastName: values.lastName,
      fiscalCode: (values.fiscalCode || '').toUpperCase(),
      birthDate: this.formatDate(values.birthDate),
      email: values.email,
      phone: values.phone,
      roles: values.roles ? [values.roles] : []
    };

    // include specialization if present
    if (values.specialization) {
      payload.specialization = values.specialization;
    }

    if (this.mode === 'create') {
      const createPayload: RegisterUserPayload = {
        username: payload.username ?? null,
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        fiscalCode: payload.fiscalCode ?? '',
        birthDate: payload.birthDate ?? null,
        email: payload.email ?? null,
        phone: payload.phone ?? null,
        roles: payload.roles ?? [],
        specialization: payload.specialization ?? null,
        password: typeof values.password === 'string' ? values.password : null
      };
      this.performCreate(createPayload);
    } else if (this.data?.user?.id != null) {
      this.performUpdate(this.data.user.id, payload);
    }
  }

  private performCreate(payload: RegisterUserPayload): void {
    this.loadSpinner(true);
    this.authApi.register(payload).subscribe({
      next: (res: SimpleResult) => this.handleResult(res),
      error: (err) => this.handleError(err, 'Creazione utente non riuscita')
    });
  }

  private performUpdate(userId: number, payload: UpdateUserPayload): void {
    this.loadSpinner(true);
    this.userService.updateUser(userId, payload).subscribe({
      next: (res: SimpleResult) => this.handleResult(res),
      error: (err) => this.handleError(err, 'Aggiornamento utente non riuscito')
    });
  }

  private handleResult(res: SimpleResult): void {
    this.loadSpinner(false);
    const resultDialogRef = this.dialog.open(ResultDialogModalComponent, {
      width: '400px',
      data: {
        titolo: res.resultMessageHeader,
        messaggio: res.resultMessage
      }
    });

    resultDialogRef.afterClosed().subscribe(() => {
      if (res.result === RESULT_OK) {
        this.dialogRef.close(true);
      }
    });
  }

  private handleError(err: unknown, fallbackMessage: string): void {
    const error = err as HttpErrorResponse;
    this.loadSpinner(false);
    this.dialog.open(ResultDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Errore',
        messaggio: error?.error?.resultMessage || fallbackMessage
      }
    });
  }

  loadSpinner(show: boolean): void {
    if (show) {
      this.spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    } else {
      this.spinnerRef?.close();
    }
  }

  displayRole(role: string): string {
    return role;
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

  close(): void {
    this.dialogRef.close(false);
  }

  private formatDate(date: Date | string | null): string | null {
    if (!date) {
      return null;
    }
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
