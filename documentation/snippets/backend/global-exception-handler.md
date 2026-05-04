# Global exception handler

## Obiettivo
Mostrare la gestione centralizzata degli errori API.

## Perche e interessante
Questo snippet evita duplicazioni nei controller e uniforma il formato delle risposte di errore, cosi il frontend riceve un comportamento prevedibile.

## Estratto reale
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler({ValidationException.class, BusinessException.class, ResourceNotFoundException.class})
    public ResponseEntity<SimpleResult> handleBusinessExceptions(RuntimeException ex) {
        // Le eccezioni di dominio diventano un failure leggibile dalla UI
        return ResponseEntity.ok(new SimpleResult().failure(ex.getMessage()));
    }

    @ExceptionHandler(InternalServerException.class)
    public ResponseEntity<SimpleResult> handleInternalServerException(InternalServerException ex) {
        // Gli errori interni vanno prima tracciati nei log
        log.error("Unhandled internal error", ex);
        // E poi tradotti in una risposta HTTP coerente
        return ResponseEntity.internalServerError().body(new SimpleResult().failure(ex.getMessage()));
    }
}
```

## Commento tecnico
- le eccezioni di business vengono riportate con una risposta uniforme
- gli errori interni vengono loggati e trasformati in HTTP 500
- i controller restano piu puliti perché non contengono gestione ripetuta degli errori
- il frontend puo gestire i messaggi con una struttura stabile
