package it.carehub.common.availability.port;

import it.carehub.common.availability.port.dto.AvailabilityBookingResult;

public interface AvailabilityBookingPort {
    AvailabilityBookingResult reserveSlot(Long availabilityId);
    AvailabilityBookingResult releaseSlot(Long availabilityId);
    AvailabilityBookingResult checkSlot(Long availabilityId);
}
