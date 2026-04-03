package it.carehub.common.exception;

public abstract class CarehubException extends RuntimeException {

    protected CarehubException(String message) {
        super(message);
    }

    protected CarehubException(String message, Throwable cause) {
        super(message, cause);
    }
}
