package it.carehub.application.exception;

import it.carehub.common.exception.BusinessException;
import it.carehub.common.exception.InternalServerException;
import it.carehub.common.exception.ResourceNotFoundException;
import it.carehub.common.exception.ValidationException;
import it.carehub.common.utils.SimpleResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<SimpleResult> handleUnexpected(Exception ex) {
        log.error("Unexpected unhandled exception", ex);
        return ResponseEntity.internalServerError().body(new SimpleResult().failure("Errore interno del server"));
    }
}
