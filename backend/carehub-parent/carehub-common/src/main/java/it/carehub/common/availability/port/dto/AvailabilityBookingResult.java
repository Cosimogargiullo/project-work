package it.carehub.common.availability.port.dto;

public record AvailabilityBookingResult(boolean success, String message) {
    public static AvailabilityBookingResult ok(String message) {
        return new AvailabilityBookingResult(true, message);
    }

    public static AvailabilityBookingResult failure(String message) {
        return new AvailabilityBookingResult(false, message);
    }
}
