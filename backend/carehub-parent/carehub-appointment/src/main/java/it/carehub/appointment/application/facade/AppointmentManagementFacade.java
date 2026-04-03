package it.carehub.appointment.application.facade;

import it.carehub.common.appointment.port.AppointmentManagementPort;
import it.carehub.appointment.domain.repository.AppointmentRepository;
import it.carehub.appointment.domain.model.Appointment;
import it.carehub.common.appointment.model.AppointmentStatus;
import it.carehub.common.availability.port.AvailabilityBookingPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AppointmentManagementFacade implements AppointmentManagementPort {

    private final AppointmentRepository appointmentRepository;
    private final AvailabilityBookingPort availabilityBookingPort;
    
    @Override
    public boolean existsByAvailabilityId(Long availabilityId) {
        if (availabilityId == null) return false;
        try {
            return appointmentRepository.existsByAvailabilityId(availabilityId);
        } catch (Exception ex) {
            log.warn("[AppointmentManagementFacade] existsByAvailabilityId failed for id={}", availabilityId, ex);
            return false;
        }
    }


    @Override
    public void deleteByDoctorId(Long doctorId) {
        log.info("[AppointmentManagementFacade] deleteByDoctorId - id={}", doctorId);
        if (doctorId != null) {
            // soft-delete active appointments for this doctor; keep availability links intact
            java.util.List<Appointment> apps = appointmentRepository.findAllByDoctorIdAndActiveTrue(doctorId);
            for (Appointment a : apps) {
                a.setActive(false);
                appointmentRepository.save(a);
            }
        }
    }

    @Override
    public void deleteByPatientId(Long patientId) {
        log.info("[AppointmentManagementFacade] deleteByPatientId - id={}", patientId);
        if (patientId != null) {
            java.util.List<Appointment> apps = appointmentRepository.findAllByPatientIdAndActiveTrue(patientId);
            for (Appointment a : apps) {
                a.setActive(false);
                appointmentRepository.save(a);
            }
        }
    }

    @Override
    public void deletePermanentlyByDoctorId(Long doctorId) {
        log.info("[AppointmentManagementFacade] deletePermanentlyByDoctorId - id={}", doctorId);
        if (doctorId != null) {
            java.util.List<Appointment> apps = appointmentRepository.findAllByDoctorId(doctorId);
            for (Appointment a : apps) {
                Long availabilityId = a.getAvailabilityId();
                if (availabilityId != null) {
                    try {
                        availabilityBookingPort.releaseSlot(availabilityId);
                    } catch (Exception ex) {
                        log.warn("[AppointmentManagementFacade] releaseSlot failed for availabilityId={}", availabilityId, ex);
                    }
                }
            }
            appointmentRepository.deleteByDoctorId(doctorId);
        }
    }

    @Override
    public void deletePermanentlyByPatientId(Long patientId) {
        log.info("[AppointmentManagementFacade] deletePermanentlyByPatientId - id={}", patientId);
        if (patientId != null) {
            java.util.List<Appointment> apps = appointmentRepository.findAllByPatientId(patientId);
            for (Appointment a : apps) {
                Long availabilityId = a.getAvailabilityId();
                if (availabilityId != null) {
                    try {
                        availabilityBookingPort.releaseSlot(availabilityId);
                    } catch (Exception ex) {
                        log.warn("[AppointmentManagementFacade] releaseSlot failed for availabilityId={}", availabilityId, ex);
                    }
                }
            }
            appointmentRepository.deleteByPatientId(patientId);
        }
    }

    @Override
    public void reactivateByDoctorId(Long doctorId) {
        log.info("[AppointmentManagementFacade] reactivateByDoctorId - id={}", doctorId);
        if (doctorId != null) {
            java.util.List<Appointment> apps = appointmentRepository.findAllByDoctorId(doctorId);
            for (Appointment a : apps) {
                if (Boolean.FALSE.equals(a.getActive())) {
                    a.setActive(true);
                    try {
                        appointmentRepository.save(a);
                    } catch (Exception ex) {
                        log.warn("[AppointmentManagementFacade] reactivate failed for appointment id={}", a.getId(), ex);
                    }
                }
            }
        }
    }

    @Override
    public void reactivateByPatientId(Long patientId) {
        log.info("[AppointmentManagementFacade] reactivateByPatientId - id={}", patientId);
        if (patientId != null) {
            java.util.List<Appointment> apps = appointmentRepository.findAllByPatientId(patientId);
            for (Appointment a : apps) {
                if (Boolean.FALSE.equals(a.getActive())) {
                    a.setActive(true);
                    try {
                        appointmentRepository.save(a);
                    } catch (Exception ex) {
                        log.warn("[AppointmentManagementFacade] reactivate failed for appointment id={}", a.getId(), ex);
                    }
                }
            }
        }
    }

    @Override
    public void markAsDone(Long appointmentId) {
        log.info("[AppointmentManagementFacade] markAsDone - id={}", appointmentId);
        if (appointmentId == null) return;

        appointmentRepository.findById(appointmentId).ifPresent(app -> {
            try {
                app.setStatus(AppointmentStatus.EFFETTUATA);
                appointmentRepository.save(app);
                // release slot if any (the appointment was performed)
                Long availabilityId = app.getAvailabilityId();
                if (availabilityId != null) {
                    try {
                        availabilityBookingPort.releaseSlot(availabilityId);
                    } catch (Exception ex) {
                        log.warn("[AppointmentManagementFacade] releaseSlot failed for availabilityId={}", availabilityId, ex);
                    }
                }
            } catch (Exception ex) {
                log.error("[AppointmentManagementFacade] markAsDone - error updating appointment id={}", appointmentId, ex);
                throw ex;
            }
        });
    }
}
