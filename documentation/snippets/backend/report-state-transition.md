# Report state transition

## Obiettivo
Evidenziare l'aggiornamento dello stato dell'appuntamento a seguito della refertazione.

## Perche e interessante
Il referto non e solo un file salvato: attiva anche una transizione di stato su un modulo diverso, quindi mostra coordinamento tra domini.

## File sorgente
- backend/carehub-parent/carehub-report/src/main/java/it/carehub/report/application/service/MedicalReportService.java

## Estratto reale
```java
// Salva prima il referto, cosi la transizione parte da un dato persistito
medicalReportRepository.save(Objects.requireNonNull(entity, "Medical report cannot be null"));
// Log operativo utile per verificare il collegamento referto-appuntamento
log.info("[MedicalReportService] create - report {} created for appointment {}", entity.getId(), appointmentId);

try {
    // La transizione di stato avviene tramite la port del modulo appointment
    appointmentManagementPort.markAsDone(appointmentId);
} catch (Exception ex) {
    // Se l'aggiornamento fallisce, il problema viene registrato con contesto completo
    log.error("[MedicalReportService] create - failed to mark appointment {} as EFFETTUATA", appointmentId, ex);
    // Il referto e stato salvato, ma il processo non e completo senza la transizione di stato
    throw new InternalServerException("Referto salvato ma errore nell'aggiornamento dello stato dell'appuntamento", ex);
}

// Conferma positiva solo quando persistono sia referto sia transizione
return result.success("Referto creato con successo");
```

## Commento tecnico
- il referto viene persistito prima della transizione di stato
- l'aggiornamento dell'appuntamento passa da una port inter-modulo
- l'errore viene trasformato in eccezione applicativa uniforme
- il modulo report non conosce i dettagli interni del modulo appointment
