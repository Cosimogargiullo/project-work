# Route guard

## Obiettivo
Mostrare protezione delle rotte per autenticazione e ruolo.

## File sorgente
- frontend/carehub-frontend/src/app/core/auth/auth.guard.ts

## Estratto reale
```typescript
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
```

## Valore architetturale
La protezione non e solo sul login: include controllo ruolo e redirect coerente.
