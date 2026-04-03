# Appointment validation

## Obiettivo
Validazione di conflitti appuntamento e precondizioni di prenotazione.

## File sorgente
- backend/carehub-parent/carehub-appointment/src/main/java/it/carehub/appointment/application/service/AppointmentService.java

## Estratto reale
```java
@Transactional
public SimpleResult create(Appointment appointment) {
	SimpleResult result = new SimpleResult();
	Optional<SimpleResult> validation = validateAppointmentPayload(appointment, true, result);
	if (validation.isPresent()) {
		return validation.get();
	}

	Long availabilityId = appointment.getAvailabilityId();

	if (availabilityId != null) {
		AvailabilityBookingResult check = availabilityBookingPort.checkSlot(availabilityId);
		if (!check.success()) {
			return result.failure(check.message());
		}
	}

	SimpleResult slotError = reserveSlotOrFailure(availabilityId, result);
	if (slotError != null) {
		return slotError;
	}

	Appointment saved = appointmentRepository.save(appointment);
	return result.success("Appuntamento creato con successo");
}
```

## Valore architetturale
Lo snippet mostra che la creazione non e una semplice `save`: valida payload, verifica stato slot e applica prenotazione conservativa prima della persistenza.
