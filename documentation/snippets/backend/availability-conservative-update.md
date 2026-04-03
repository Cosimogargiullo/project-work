# Availability conservative update

## Obiettivo
Mostrare la logica che preserva gli slot gia prenotati o referenziati.

## File sorgente
- backend/carehub-parent/carehub-availability/src/main/java/it/carehub/availability/application/service/AvailabilityService.java

## Estratto reale
```java
if (replaceExisting) {
	List<AvailableDate> existingSlots = availabilityRepository
		.findByDoctorIdAndAvailableDayOrderByAvailableTimeAsc(doctorId, baseDate);

	List<AvailableDate> toDelete = existingSlots.stream()
			.filter(s -> !s.isBooked())
			.toList();

	if (!toDelete.isEmpty()) {
		List<AvailableDate> removable = new ArrayList<>();
		for (AvailableDate ad : toDelete) {
			Long aid = ad.getId();
			boolean referenced = appointmentManagementPort.existsByAvailabilityId(aid);
			if (!referenced) removable.add(ad);
		}

		if (!removable.isEmpty()) {
			availabilityRepository.deleteAll(removable);
		}
	}
}
```

## Valore architetturale
L'aggiornamento non elimina in modo distruttivo: conserva slot occupati e slot ancora referenziati dagli appuntamenti.
