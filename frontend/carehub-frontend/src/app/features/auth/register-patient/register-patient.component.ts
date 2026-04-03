import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { AuthApiService } from '../service/auth-api.service';
import { ProgressSpinnerComponent } from '../../../utils/progress-spinner/progress-spinner.component';
import { ResultDialogModalComponent } from '../../../utils/result-dialog-modal/result-dialog-modal.component';
import { SimpleResult } from '../../../core/models/simple-result.model';
import { RESULT_OK } from '../../../core/constants/api-endpoints';
import { USER_ROLES } from '../../../core/constants/user-roles';

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

@Component({
    selector: 'app-register-patient',
    templateUrl: './register-patient.component.html',
    styleUrl: './register-patient.component.scss'
})

export class RegisterPatientComponent {
    loading = false;

    // email semplice: deve avere @ e almeno un punto dopo @
    private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // CF: SOLO uppercase
    private readonly fiscalCodePattern = /^[A-Z0-9]{16}$/;
    // telefono: cifre + spazi + simboli comuni, minimo 7
    private readonly phonePattern = /^[0-9+()\-\s]{7,20}$/;

    form = this.fb.group(
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
        },
        { validators: [passwordsMatch] }
    );

    constructor(private fb: FormBuilder, private authApi: AuthApiService, private router: Router, private dialog: MatDialog) {
        // normalizza automaticamente a uppercase durante la digitazione
        this.form.controls.fiscalCode.valueChanges.subscribe(() => toUppercase(this.form.controls.fiscalCode));
    }

    submit() {
        if (this.form.invalid) return;

        this.loading = true;

        // Mostra lo spinner
        const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });

        const payload = {
            username: this.form.value.username ?? null,
            firstName: this.form.value.firstName ?? null,
            lastName: this.form.value.lastName ?? null,
            fiscalCode: (this.form.value.fiscalCode ?? '').toUpperCase(),
            birthDate: this.form.value.birthDate ?? null,
            email: this.form.value.email ?? null,
            phone: this.form.value.phone ?? null,
            password: this.form.value.password ?? null,
            roles: [USER_ROLES.PAZIENTE]
        };

        this.authApi.registerPatient(payload).subscribe({
            next: (res: SimpleResult) => {
                this.loading = false;
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
                        this.router.navigate(['/login']);
                    }
                });
            },
            error: (err) => {
                this.loading = false;
                spinnerRef.close();
                this.dialog.open(ResultDialogModalComponent, {
                    width: '400px',
                    data: {
                        titolo: 'Registrazione non riuscita',
                        messaggio: err?.error?.resultMessage || 'Si è verificato un errore durante la registrazione.'
                    }
                });
            }
        });
    }
}

