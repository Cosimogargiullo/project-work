# Facade pattern nei pannelli frontend

## Obiettivo
Mostrare la separazione tra componente visuale e orchestrazione dati nel pannello appuntamenti.

## Perche e interessante
Il componente UI resta leggero, mentre la facade concentra recupero dati, enrichment e filtri: e una scelta che rende il pannello piu leggibile e piu facile da mantenere.

## File sorgente
- frontend/carehub-frontend/src/app/features/home/panels/appointments/appointments-facade.service.ts

## Estratto reale
```typescript
loadBaseAppointments(isPatient: boolean, currentUserId: number | null): Observable<Appointment[]> {
	// Il paziente vede solo i propri appuntamenti; gli altri ruoli leggono tutto
	if (isPatient && currentUserId) {
		// Riduce il perimetro dei dati gia in fase di caricamento
		return this.appointmentService.filter({ patientId: currentUserId }).pipe(catchError(() => of([])));
	}
	// Fallback sicuro in caso di errore HTTP
	return this.appointmentService.getAll().pipe(catchError(() => of([])));
}

applyFilters(appointments: Appointment[], filterState: AppointmentFilterState): Appointment[] {
	return appointments.filter((appointment) => {
		// Filtro lato facade per non caricare logica nel componente visuale
		if (filterState.isDoctor && filterState.currentDoctorId && appointment.doctorId !== filterState.currentDoctorId) {
			// Un medico vede solo i propri appuntamenti in questa vista
			return false;
		}
		// Lo stato selezionato viene applicato come filtro principale
		if (filterState.selectedStatus && filterState.selectedStatus !== 'all') {
			return appointment.status === filterState.selectedStatus;
		}
		// Se non ci sono vincoli aggiuntivi, il record passa il filtro
		return true;
	});
}
```

## Commento tecnico
- il recupero dati viene centralizzato nella facade
- i fallback evitano che l'interfaccia si blocchi completamente
- i filtri principali stanno fuori dal componente visuale
- il pattern riduce accoppiamento tra UI e logica dati
