package it.carehub.application.api;

import it.carehub.appointment.api.controller.AppointmentController;
import it.carehub.appointment.application.service.AppointmentService;
import it.carehub.appointment.domain.model.Appointment;
import it.carehub.common.appointment.model.AppointmentStatus;
import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.utils.SimpleResult;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AppointmentControllerOwnershipIT {

        @Test
        void patientCannotReadAnotherPatientAppointment() {
                AppointmentService appointmentService = mock(AppointmentService.class);
                AppointmentController controller = new AppointmentController(appointmentService);

                Appointment appointment = sampleAppointment(10L, 2L);
                when(appointmentService.findById(10L)).thenReturn(Optional.of(appointment));

                HttpStatus status = HttpStatus.valueOf(controller.getById(10L, false, patientAuth(1L)).getStatusCode().value());
                assertEquals(HttpStatus.FORBIDDEN, status);
        }

        @Test
        void patientCanReadOwnAppointment() {
                AppointmentService appointmentService = mock(AppointmentService.class);
                AppointmentController controller = new AppointmentController(appointmentService);

                Appointment appointment = sampleAppointment(10L, 1L);
                when(appointmentService.findById(10L)).thenReturn(Optional.of(appointment));

                HttpStatus status = HttpStatus.valueOf(controller.getById(10L, false, patientAuth(1L)).getStatusCode().value());
                assertEquals(HttpStatus.OK, status);
        }

        @Test
        void createForcesPatientIdFromAuthenticatedUser() {
                AppointmentService appointmentService = mock(AppointmentService.class);
                AppointmentController controller = new AppointmentController(appointmentService);

                Appointment payload = sampleAppointment(null, 999L);
                when(appointmentService.create(any(Appointment.class))).thenReturn(new SimpleResult().success("ok"));

                controller.create(payload, patientAuth(1L));

                assertEquals(1L, payload.getPatientId());
                verify(appointmentService).create(payload);
        }

        private Appointment sampleAppointment(Long id, Long patientId) {
                return Appointment.builder()
                                .id(id)
                                .patientId(patientId)
                                .doctorId(11L)
                                .availabilityId(100L)
                                .visitType(VisitType.VISITA_CARDIOLOGICA)
                                .appointmentDay(LocalDate.now().plusDays(1))
                                .appointmentTime(LocalTime.of(9, 0))
                                .status(AppointmentStatus.PRENOTATO)
                                .notes("test")
                                .active(true)
                                .build();
        }

        private UsernamePasswordAuthenticationToken patientAuth(Long userId) {
                UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                                "patient",
                                "n/a",
                                List.of(new SimpleGrantedAuthority("ROLE_PAZIENTE"))
                );
                token.setDetails(userId);
                return token;
        }
}
