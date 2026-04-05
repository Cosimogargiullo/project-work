import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ResultDialogModalComponent } from '@app/utils/result-dialog-modal/result-dialog-modal.component';
import { ProgressSpinnerComponent } from '../../../utils/progress-spinner/progress-spinner.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {
  loading = false;
  error = false;
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private dialog: MatDialog) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = false;
    const spinnerRef = this.dialog.open(ProgressSpinnerComponent, { disableClose: true });
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.loading = false;
        spinnerRef.close();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        spinnerRef.close();
        const msg = err?.error?.resultMessage || 'Credenziali non valide';
        const header = err?.error?.resultMessageHeader || 'Errore';
        this.dialog.open(ResultDialogModalComponent, { width: '400px', data: { titolo: header, messaggio: msg } });
        this.error = true;
      }
    });
  }
}
