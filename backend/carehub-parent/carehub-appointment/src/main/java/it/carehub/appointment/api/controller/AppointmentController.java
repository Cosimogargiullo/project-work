package it.carehub.appointment.api.controller;

import it.carehub.appointment.application.service.AppointmentService;
import it.carehub.appointment.domain.model.Appointment;
import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.appointment.model.AppointmentStatus;
import it.carehub.common.appointment.dto.AppointmentFilter;
import it.carehub.common.utils.SimpleResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SEGRETERIA', 'MEDICO', 'PAZIENTE')")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public List<Appointment> getAll(Authentication auth) {
        if (hasPazienteRole(auth)) {
            AppointmentFilter filter = new AppointmentFilter();
            filter.setPatientId(currentUserId(auth));
            return appointmentService.filter(filter);
        }
        return appointmentService.findAll();
    }

    @GetMapping("/visit-types")
    public List<VisitType> getVisitTypes() {
        return appointmentService.getVisitTypes();
    }

    @GetMapping("/statuses")
    public List<AppointmentStatus> getStatuses() {
        return appointmentService.getStatuses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable Long id,
                                               @RequestParam(name = "includeInactive", required = false) Boolean includeInactive,
                                               Authentication auth) {
        if (Boolean.TRUE.equals(includeInactive)) {
            return appointmentService.findByIdIncludingInactive(id)
                    .filter(a -> !hasPazienteRole(auth) || currentUserId(auth).equals(a.getPatientId()))
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(hasPazienteRole(auth) ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND).build());
        }
        return appointmentService.findById(id)
                .filter(a -> !hasPazienteRole(auth) || currentUserId(auth).equals(a.getPatientId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(hasPazienteRole(auth) ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<SimpleResult> create(@RequestBody Appointment appointment, Authentication auth) {
        // A PAZIENTE can only book appointments for himself
        if (hasPazienteRole(auth)) {
            appointment.setPatientId(currentUserId(auth));
        }
        return ResponseEntity.ok(appointmentService.create(appointment));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SEGRETERIA', 'MEDICO')")
    public ResponseEntity<SimpleResult> update(@PathVariable Long id, @RequestBody Appointment appointment) {
        return ResponseEntity.ok(appointmentService.update(id, appointment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SEGRETERIA', 'MEDICO')")
    public ResponseEntity<SimpleResult> delete(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.delete(id));
    }

    @PostMapping("/filter")
    public List<Appointment> filter(@RequestBody AppointmentFilter filter, Authentication auth) {
        // PAZIENTE can only filter their own appointments
        if (hasPazienteRole(auth)) {
            filter.setPatientId(currentUserId(auth));
        }
        return appointmentService.filter(filter);
    }

    // ---- helpers ----

    private boolean hasPazienteRole(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PAZIENTE"));
    }

    private Long currentUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Long id) {
            return id;
        }
        return null;
    }
}
