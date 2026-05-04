# Availability conservative update

## Obiettivo
Mostrare la logica che preserva gli slot gia prenotati o ancora referenziati dagli appuntamenti.

## Perche e interessante
Qui si vede un trade-off importante: l'aggiornamento delle disponibilita non e distruttivo, ma tutela la consistenza del calendario medico.

## File sorgente
- backend/carehub-parent/carehub-availability/src/main/java/it/carehub/availability/application/service/AvailabilityService.java

## Estratto reale
```java
if (replaceExisting) {
    // Recupera tutti gli slot gia presenti per medico e data
    List<AvailableDate> existingSlots = availabilityRepository
            .findByDoctorIdAndAvailableDayOrderByAvailableTimeAsc(doctorId, baseDate);

    // Considera solo gli slot ancora non prenotati
    List<AvailableDate> toDelete = existingSlots.stream()
            .filter(s -> !s.isBooked())
            .toList();

    if (!toDelete.isEmpty()) {
        // Prepara la lista finale degli slot realmente eliminabili
        List<AvailableDate> removable = new ArrayList<>();
        for (AvailableDate ad : toDelete) {
            // Ogni slot deve essere controllato contro gli appuntamenti esistenti
            Long aid = ad.getId();
            boolean referenced = appointmentManagementPort.existsByAvailabilityId(aid);
            if (!referenced) removable.add(ad);
        }

        if (!removable.isEmpty()) {
            // Elimina solo i record sicuri, evitando danni agli slot referenziati
            availabilityRepository.deleteAll(removable);
        }
    }
}
```

## Commento tecnico
- gli slot occupati non vengono rimossi
- gli slot liberi ma ancora referenziati restano protetti
- la cancellazione avviene solo sui record davvero sostituibili
- il controllo passa da una port applicativa, non da una relazione JPA diretta
