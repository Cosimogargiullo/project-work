# Route guard

## Obiettivo
Mostrare la protezione delle rotte per autenticazione e ruolo.

## Perche e interessante
Il guard evita di esporre schermate protette a utenti non autorizzati e rende il routing coerente con lo stato dell'applicazione.

## File sorgente
- frontend/carehub-frontend/src/app/core/auth/auth.guard.ts

## Estratto reale
```typescript
export const authGuard: CanActivateFn = () => {
	const auth = inject(AuthService);
	const router = inject(Router);
	// Blocca l'accesso se l'utente non risulta autenticato
	const authenticated = auth.isAuthenticated();
	if (!authenticated) {
		// In caso di sessione assente, riporta al login
		router.navigate(['/login']);
	}
	// Restituisce il risultato del controllo di accesso
	return authenticated;
};

export const roleGuard = (roles: string[]): CanActivateFn => {
	return () => {
		const auth = inject(AuthService);
		const router = inject(Router);
		// Verifica sia login sia appartenenza a uno dei ruoli richiesti
		const ok = auth.isAuthenticated() && auth.hasRole(roles);
		if (!ok) router.navigate(['/login']);
		// Consente la rotta solo se autenticazione e ruoli sono coerenti
		return ok;
	};
};
```

## Commento tecnico
- la protezione non e solo sul login
- i ruoli vengono controllati prima dell'attivazione della rotta
- il redirect al login evita schermate parzialmente renderizzate
- la logica di accesso resta centralizzata e riusabile
