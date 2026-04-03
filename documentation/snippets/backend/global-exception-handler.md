# Global exception handler

## Obiettivo
Mostrare gestione centralizzata errori API.

## File sorgente
- backend/carehub-parent/carehub-application/src/main/java/it/carehub/application/exception/GlobalExceptionHandler.java

## Estratto reale
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler({ValidationException.class, BusinessException.class, ResourceNotFoundException.class})
	public ResponseEntity<SimpleResult> handleBusinessExceptions(RuntimeException ex) {
		return ResponseEntity.ok(new SimpleResult().failure(ex.getMessage()));
	}

	@ExceptionHandler(InternalServerException.class)
	public ResponseEntity<SimpleResult> handleInternalServerException(InternalServerException ex) {
		log.error("Unhandled internal error", ex);
		return ResponseEntity.internalServerError().body(new SimpleResult().failure(ex.getMessage()));
	}
}
```

## Valore architetturale
Errore e risposta sono uniformati per tutti i controller, evitando logica duplicata nei singoli endpoint.
