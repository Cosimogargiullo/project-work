package it.carehub.availability.application.facade;

import it.carehub.availability.domain.model.AvailableDate;
import it.carehub.common.availability.port.AvailabilityManagementPort;
import it.carehub.common.appointment.port.AppointmentManagementPort;
import it.carehub.availability.domain.repository.AvailabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AvailabilityManagementFacade implements AvailabilityManagementPort {

    private final AvailabilityRepository availabilityRepository;
    private final AppointmentManagementPort appointmentManagementPort;

    @Override
    public void deleteByDoctorId(Long doctorId) {
        log.info("[AvailabilityManagementFacade] deleteByDoctorId - id={}", doctorId);
        if (doctorId != null) {
            // delete only non-booked slots to avoid removing availabilities referenced by appointments
            List<AvailableDate> candidates = availabilityRepository.findByDoctorIdAndIsBookedFalseOrderByAvailableDayAscAvailableTimeAsc(doctorId);
            if (candidates == null || candidates.isEmpty()) return;

            List<AvailableDate> toDelete = new java.util.ArrayList<>();
            for (AvailableDate ad : candidates) {
                Long id = ad.getId();
                // skip if any appointment references this availability
                boolean referenced = false;
                try {
                    referenced = appointmentManagementPort.existsByAvailabilityId(id);
                } catch (Exception ex) {
                    log.warn("[AvailabilityManagementFacade] appointment exists check failed for availabilityId={}", id, ex);
                }
                if (!referenced) {
                    toDelete.add(ad);
                }
            }

            if (!toDelete.isEmpty()) {
                availabilityRepository.deleteAll(toDelete);
            }
        }
    }
}
