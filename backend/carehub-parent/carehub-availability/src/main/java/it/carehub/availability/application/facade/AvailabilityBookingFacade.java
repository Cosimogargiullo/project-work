package it.carehub.availability.application.facade;

import it.carehub.availability.domain.repository.AvailabilityRepository;
import it.carehub.common.availability.port.AvailabilityBookingPort;
import it.carehub.common.availability.port.dto.AvailabilityBookingResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AvailabilityBookingFacade implements AvailabilityBookingPort {

    private final AvailabilityRepository availabilityRepository;

    @Override
    public AvailabilityBookingResult reserveSlot(Long availabilityId) {
        log.info("[AvailabilityBookingFacade] reserveSlot - availabilityId={}", availabilityId);
        if (availabilityId == null) {
            return AvailabilityBookingResult.failure("Slot non specificato");
        }

        return availabilityRepository.findById(availabilityId)
                .map(slot -> {
                    if (!slot.isActive() || slot.isBooked()) {
                        return AvailabilityBookingResult.failure("Lo slot selezionato non è più disponibile");
                    }
                    slot.setActive(false);
                    slot.setBooked(true);
                    availabilityRepository.save(slot);
                    return AvailabilityBookingResult.ok("Slot riservato");
                })
                .orElseGet(() -> AvailabilityBookingResult.failure("Slot di disponibilità non trovato"));
    }

    @Override
    public AvailabilityBookingResult checkSlot(Long availabilityId) {
        log.info("[AvailabilityBookingFacade] checkSlot - availabilityId={}", availabilityId);
        if (availabilityId == null) {
            return AvailabilityBookingResult.failure("Slot non specificato");
        }

        return availabilityRepository.findById(availabilityId)
                .map(slot -> {
                    if (!slot.isActive()) {
                        return AvailabilityBookingResult.failure("Lo slot non è disponibile");
                    }
                    if (slot.isBooked()) {
                        return AvailabilityBookingResult.failure("Lo slot è già prenotato");
                    }
                    return AvailabilityBookingResult.ok("Slot disponibile");
                })
                .orElseGet(() -> AvailabilityBookingResult.failure("Slot di disponibilità non trovato"));
    }

    @Override
    public AvailabilityBookingResult releaseSlot(Long availabilityId) {
        log.info("[AvailabilityBookingFacade] releaseSlot - availabilityId={}", availabilityId);
        if (availabilityId == null) {
            return AvailabilityBookingResult.failure("Slot non specificato");
        }

        return availabilityRepository.findById(availabilityId)
                .map(slot -> {
                    if (slot.isActive() && !slot.isBooked()) {
                        return AvailabilityBookingResult.ok("Slot già attivo");
                    }
                    slot.setActive(true);
                    slot.setBooked(false);
                    availabilityRepository.save(slot);
                    return AvailabilityBookingResult.ok("Slot riattivato");
                })
                .orElseGet(() -> AvailabilityBookingResult.failure("Slot di disponibilità non trovato"));
    }
}
