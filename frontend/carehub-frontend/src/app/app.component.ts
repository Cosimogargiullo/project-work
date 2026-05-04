import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from './core/auth/auth.service';
import { ConfirmDialogModalComponent } from './utils/confirm-dialog-modal/confirm-dialog-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'carehub-frontend';
  constructor(public auth: AuthService, private router: Router, private dialog: MatDialog) {}

  // Convenience helpers for template
  isAuthenticated() { return this.auth.isAuthenticated(); }
  hasRole(role: string) { return this.auth.hasRole(role); }
  logout() {
    const dialogRef = this.dialog.open(ConfirmDialogModalComponent, {
      width: '400px',
      data: {
        titolo: 'Conferma logout',
        messaggio: 'Sei sicuro di voler effettuare il logout?',
        cancelLabel: 'Annulla',
        confirmLabel: 'Logout'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
