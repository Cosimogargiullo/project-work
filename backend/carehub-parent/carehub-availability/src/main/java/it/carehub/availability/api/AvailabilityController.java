package it.carehub.availability.api;

import it.carehub.availability.application.service.AvailabilityService;
import it.carehub.availability.domain.model.AvailableDate;
import it.carehub.common.availability.dto.CreateAvailableSlotsRequest;
import it.carehub.common.utils.SimpleResult;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availabilities")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SEGRETERIA', 'MEDICO')")
public class AvailabilityController {
    private final AvailabilityService availabilityService;

    @GetMapping
    public List<AvailableDate> getAll(@RequestParam(required = false, name = "isActive") Boolean isActive) {
        return availabilityService.getAll(isActive);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SEGRETERIA', 'MEDICO', 'PAZIENTE')")
    public List<AvailableDate> getByDoctor(@PathVariable Long doctorId, @RequestParam(required = false, name = "isActive") Boolean isActive) {
        return availabilityService.getByDoctor(doctorId, isActive);
    }

    @GetMapping("/doctor/{doctorId}/date/{date}")
    @PreAuthorize("permitAll()")
    public CreateAvailableSlotsRequest getSlotsByDoctorAndDate(
            @PathVariable Long doctorId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false, name = "isActive") Boolean isActive,
            @RequestParam(required = false, name = "notBooked") Boolean notBooked) {
        return availabilityService.getSlotsByDoctorAndDate(doctorId, date, isActive, notBooked);
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<AvailableDate> getById(@PathVariable Long id) {
        return availabilityService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SimpleResult> create(@RequestBody CreateAvailableSlotsRequest request) {
        return ResponseEntity.ok(availabilityService.create(request));
    }

    @PutMapping
    public ResponseEntity<SimpleResult> update(@RequestBody CreateAvailableSlotsRequest request) {
        return ResponseEntity.ok(availabilityService.update(request));
    }

    @DeleteMapping("/doctor/{doctorId}/date/{date}")
    public ResponseEntity<SimpleResult> deleteByDoctorAndDate(
            @PathVariable Long doctorId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(availabilityService.deleteByDoctorAndDate(doctorId, date));
    }

    /**
     * Restituisce tutti i valori possibili per la durata degli slot
     * (enum availability_duration in PostgreSQL).
     */
    @GetMapping("/durations")
    public List<String> getDurations() {
        return availabilityService.getDurations();
    }
}