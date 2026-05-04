import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authenticated = auth.isAuthenticated();
  if (!authenticated) {
    router.navigate(['/login']);
  }
  return authenticated;
};

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const ok = auth.isAuthenticated() && auth.hasRole(roles);
    if (!ok) router.navigate(['/login']);
    return ok;
  };
};

export const isAuthenticatedMatch: CanMatchFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated();
};
