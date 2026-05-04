import { Routes } from '@angular/router';
import { authGuard, isAuthenticatedMatch } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterPatientComponent } from './features/auth/register-patient/register-patient.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterPatientComponent },

  // Root: se autenticato vai a home
  { path: '', pathMatch: 'full', redirectTo: 'home', canMatch: [isAuthenticatedMatch] },
  // Root: se non autenticato vai a login
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'home',
    canMatch: [isAuthenticatedMatch],
    canActivate: [authGuard],
    loadChildren: () => import('./features/home/home/home.module').then(m => m.HomeModule)
  },
  { path: '**', redirectTo: 'login' }
];
