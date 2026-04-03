# RxJS error handling

## Obiettivo
Mostrare gestione errori asincroni nella catena Observable con fallback non bloccante.

## File sorgente
- frontend/carehub-frontend/src/app/features/home/panels/reports/reports-facade.service.ts

## Estratto reale
```typescript
return forkJoin({
	users: userRequests.length ? forkJoin(userRequests) : of([] as (User | null)[]),
	appointments: appointmentRequests.length ? forkJoin(appointmentRequests) : of([] as (Appointment | null)[])
}).pipe(
	map(({ users, appointments }) => {
		// ...mapping e enrichment
		return { patientNames, doctorNames, appointmentDates };
	}),
	catchError((error: unknown) => {
		this.logger.error('ReportsFacadeService.enrichReports', error);
		return of({ patientNames: {}, doctorNames: {}, appointmentDates: {} });
	})
);
```

## Valore architetturale
In caso di errore, la UI continua a funzionare con fallback sicuro e logging centralizzato.
