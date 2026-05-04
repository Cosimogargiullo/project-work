# Appointment validation

## Obiettivo
Mostrare come la creazione di un appuntamento non sia una semplice `save`, ma un flusso con validazione, controllo disponibilita e prenotazione conservativa.

## Perche e interessante
Questo passaggio mette insieme regole di dominio, port applicative e transazione unica: e uno dei punti piu delicati del backend.

## File sorgente
- backend/carehub-parent/carehub-appointment/src/main/java/it/carehub/appointment/application/service/AppointmentService.java

## Estratto reale
```java
@Transactional
public SimpleResult create(Appointment appointment) {
    // Oggetto risultato riusato per restituire esiti coerenti al chiamante
    SimpleResult result = new SimpleResult();
    // Prima di toccare disponibilita o repository, valida i campi del DTO
    Optional<SimpleResult> validation = validateAppointmentPayload(appointment, true, result);
    if (validation.isPresent()) {
        // Se il payload non e valido, interrompe subito il flusso
        return validation.get();
    }

    // Lo slot e opzionale, ma se presente va verificato
    Long availabilityId = appointment.getAvailabilityId();

    if (availabilityId != null) {
        // Controlla che lo slot sia ancora libero e prenotabile
        AvailabilityBookingResult check = availabilityBookingPort.checkSlot(availabilityId);
        if (!check.success()) {
            // Riporta il messaggio di business senza proseguire
            return result.failure(check.message());
        }
    }

    // Prenota lo slot in modo conservativo prima della persistenza finale
    SimpleResult slotError = reserveSlotOrFailure(availabilityId, result);
    if (slotError != null) {
        // Se la prenotazione non va a buon fine, evita salvataggi parziali
        return slotError;
    }

    // Solo ora il dato viene salvato definitivamente
    Appointment saved = appointmentRepository.save(appointment);
    // Restituisce un esito positivo uniforme per la UI
    return result.success("Appuntamento creato con successo");
}
```

## Commento tecnico
- la validazione iniziale blocca subito i payload incoerenti
- il controllo sullo slot evita conflitti di prenotazione
- `reserveSlotOrFailure` preserva la coerenza con lo stato della disponibilita
- il `save` arriva solo dopo i controlli di dominio
