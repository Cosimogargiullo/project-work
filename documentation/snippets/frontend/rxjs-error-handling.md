# RxJS error handling

## Obiettivo
Mostrare la gestione degli errori asincroni nella catena Observable con fallback non bloccante.

## Perche e interessante
Questo frammento mostra un punto delicato dell'UI: l'enrichment dei referti usa piu chiamate parallele, ma in caso di errore restituisce comunque una struttura valida e loggata.

## File sorgente
- frontend/carehub-frontend/src/app/features/home/panels/reports/reports-facade.service.ts

## Estratto reale
```typescript
return forkJoin({
	// Recupera in parallelo utenti e appuntamenti associati ai referti
	users: userRequests.length ? forkJoin(userRequests) : of([] as (User | null)[]),
	appointments: appointmentRequests.length ? forkJoin(appointmentRequests) : of([] as (Appointment | null)[])
}).pipe(
	map(({ users, appointments }) => {
		// Mapping dei risultati nel formato usato dalla tabella dei referti
		// La trasformazione avviene dopo che tutte le chiamate parallele sono concluse
		return { patientNames, doctorNames, appointmentDates };
	}),
	catchError((error: unknown) => {
		// Il fallimento di una chiamata non blocca l'intero pannello
		this.logger.error('ReportsFacadeService.enrichReports', error);
		// Rientra con una struttura vuota ma valida per non rompere il rendering
		return of({ patientNames: {}, doctorNames: {}, appointmentDates: {} });
	})
);
```

## Commento tecnico
- le richieste parallele riducono il costo di caricamento dei dati correlati
- il fallback evita un blocco totale del pannello
- il logging rende tracciabile il problema senza interrompere l'uso della UI
- la facade tiene separato l'enrichment dalla presentazione
