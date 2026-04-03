# Facade pattern nei pannelli frontend

## Obiettivo
Mostrare separazione tra componente visuale e orchestrazione dati.

## File sorgente
- frontend/carehub-frontend/src/app/features/home/panels/appointments/appointments-facade.service.ts

## Estratto reale
```typescript
loadBaseAppointments(isPatient: boolean, currentUserId: number | null): Observable<Appointment[]> {
	if (isPatient && currentUserId) {
		return this.appointmentService.filter({ patientId: currentUserId }).pipe(catchError(() => of([])));
	}
	return this.appointmentService.getAll().pipe(catchError(() => of([])));
}

applyFilters(appointments: Appointment[], filterState: AppointmentFilterState): Appointment[] {
	return appointments.filter((appointment) => {
		if (filterState.isDoctor && filterState.currentDoctorId && appointment.doctorId !== filterState.currentDoctorId) {
			return false;
		}
		if (filterState.selectedStatus && filterState.selectedStatus !== 'all') {
			return appointment.status === filterState.selectedStatus;
		}
		return true;
	});
}
```

## Valore architetturale
La facade centralizza recupero dati, enrichment e filtri, lasciando il componente UI piu semplice e manutenibile.
