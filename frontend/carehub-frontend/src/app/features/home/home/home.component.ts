import { Component } from '@angular/core';
import { AuthService } from '@app/core/auth/auth.service';
import { USER_ROLES } from '@app/core/constants/user-roles';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private auth: AuthService) {}

  // pannello attivo nell'accordion (escluso il profilo, che resta sempre aperto)
  activePanel: 'users' | 'availability' | 'reports' | 'analytics' | null = null;

  get username(): string {
    return this.auth.getUsername() ?? 'User';
  }

  get isPatient(): boolean {
    const roles = this.auth.getRoles();
    return roles.includes(USER_ROLES.PAZIENTE);
  }

  get isAdmin(): boolean {
    const roles = this.auth.getRoles();
    return roles.includes(USER_ROLES.ADMIN);
  }

  get isSecretary(): boolean {
    const roles = this.auth.getRoles();
    return roles.includes(USER_ROLES.SEGRETERIA);
  }

  get isDoctor(): boolean {
    const roles = this.auth.getRoles();
    return roles.includes(USER_ROLES.MEDICO);
  }

  setActivePanel(panel: 'users' | 'availability' | 'reports' | 'analytics'): void {
    this.activePanel = panel;
  }

  onPanelClosed(panel: 'users' | 'availability' | 'reports' | 'analytics'): void {
    if (this.activePanel === panel) {
      this.activePanel = null;
    }
  }
}
