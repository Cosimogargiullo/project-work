package it.carehub.report.api.controller;

import it.carehub.common.report.dto.MedicalReportFilter;
import it.carehub.common.utils.SimpleResult;
import it.carehub.report.application.service.MedicalReportService;
import it.carehub.report.domain.model.MedicalReport;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO')")
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public List<MedicalReport> getAll(Authentication auth) {
        if (hasPazienteRole(auth)) {
            return medicalReportService.findByPatientId(currentUserId(auth));
        }
        return medicalReportService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public ResponseEntity<MedicalReport> getById(@PathVariable Long id, Authentication auth) {
        return medicalReportService.findById(id)
                .filter(r -> !hasPazienteRole(auth) || currentUserId(auth).equals(r.getPatientId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(hasPazienteRole(auth) ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public ResponseEntity<List<MedicalReport>> getByPatientId(@PathVariable Long id, Authentication auth) {
        // A PAZIENTE can only query their own reports
        if (hasPazienteRole(auth) && !currentUserId(auth).equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(medicalReportService.findByPatientId(id));
    }

    @GetMapping("/doctor/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public ResponseEntity<List<MedicalReport>> getByDoctorId(@PathVariable Long id) {
        return ResponseEntity.ok(medicalReportService.findByDoctorId(id));
    }

    @GetMapping("/appointment/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public ResponseEntity<MedicalReport> getByAppointmentId(@PathVariable Long id, Authentication auth) {
        return medicalReportService.findByAppointmentId(id)
                .filter(r -> !hasPazienteRole(auth) || currentUserId(auth).equals(r.getPatientId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(hasPazienteRole(auth) ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/filter")
    public List<MedicalReport> filter(@RequestBody MedicalReportFilter filter, Authentication auth) {
        // PAZIENTE can only filter their own reports
        if (hasPazienteRole(auth)) {
            filter.setPatientId(currentUserId(auth));
        }
        return medicalReportService.filter(filter);
    }

    @GetMapping("/{id}/file")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id, Authentication auth) {
        return medicalReportService.findById(id)
                .filter(r -> !hasPazienteRole(auth) || currentUserId(auth).equals(r.getPatientId()))
                .map(report -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(resolveMediaType(report.getContentType()));

                    String fileName = (report.getFileName() == null || report.getFileName().isBlank())
                            ? "referto.pdf"
                            : report.getFileName();
                    headers.setContentDisposition(
                            ContentDisposition.attachment().filename(fileName, StandardCharsets.UTF_8).build()
                    );

                    return new ResponseEntity<>(report.getPdfContent(), headers, HttpStatus.OK);
                })
                .orElse(ResponseEntity.status(hasPazienteRole(auth) ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND).build());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SimpleResult> create(
            @RequestParam("patientId") Long patientId,
            @RequestParam("doctorId") Long doctorId,
            @RequestParam("appointmentId") Long appointmentId,
            @RequestParam(value = "summary", required = false) String summary,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam("cost") String cost,
            @RequestParam("file") MultipartFile file) {

        BigDecimal parsedCost;
        try {
            parsedCost = new BigDecimal(cost);
        } catch (Exception ex) {
            return ResponseEntity.ok(new SimpleResult().failure("Il costo deve essere un numero valido"));
        }

        return ResponseEntity.ok(medicalReportService.create(patientId, doctorId, appointmentId, summary, notes, parsedCost, file));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SimpleResult> update(
            @PathVariable Long id,
            @RequestParam("patientId") Long patientId,
            @RequestParam("doctorId") Long doctorId,
            @RequestParam("appointmentId") Long appointmentId,
            @RequestParam(value = "summary", required = false) String summary,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam("cost") String cost,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        BigDecimal parsedCost;
        try {
            parsedCost = new BigDecimal(cost);
        } catch (Exception ex) {
            return ResponseEntity.ok(new SimpleResult().failure("Il costo deve essere un numero valido"));
        }

        return ResponseEntity.ok(medicalReportService.update(id, patientId, doctorId, appointmentId, summary, notes, parsedCost, file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<SimpleResult> delete(@PathVariable Long id) {
        return ResponseEntity.ok(medicalReportService.delete(id));
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

    private MediaType resolveMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_PDF;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception ignored) {
            return MediaType.APPLICATION_PDF;
        }
    }
}