# Report state transition

## Obiettivo
Evidenziare l'aggiornamento dello stato appuntamento a seguito della refertazione.

## File sorgente
- backend/carehub-parent/carehub-report/src/main/java/it/carehub/report/application/service/MedicalReportService.java

## Estratto reale
```java
medicalReportRepository.save(Objects.requireNonNull(entity, "Medical report cannot be null"));
log.info("[MedicalReportService] create - report {} created for appointment {}", entity.getId(), appointmentId);

try {
	appointmentManagementPort.markAsDone(appointmentId);
} catch (Exception ex) {
	log.error("[MedicalReportService] create - failed to mark appointment {} as EFFETTUATA", appointmentId, ex);
	throw new InternalServerException("Referto salvato ma errore nell'aggiornamento dello stato dell'appuntamento", ex);
}

return result.success("Referto creato con successo");
```

## Valore architetturale
La transizione di stato passa tramite port inter-modulo (`AppointmentManagementPort`), mantenendo basso accoppiamento tra moduli.
