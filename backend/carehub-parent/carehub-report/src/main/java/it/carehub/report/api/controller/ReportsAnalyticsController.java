package it.carehub.report.api.controller;

import it.carehub.common.report.dto.AnalyticsOverviewDto;
import it.carehub.common.report.dto.DoctorRevenueDto;
import it.carehub.common.report.dto.MonthlyRevenueDto;
import it.carehub.report.application.service.MedicalReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports/analytics")
@RequiredArgsConstructor
public class ReportsAnalyticsController {

    private final MedicalReportService medicalReportService;

    // Overview for all reports (admin/segretaria)
    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA')")
    public AnalyticsOverviewDto overviewAll(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return medicalReportService.getOverview(from, to, null, null);
    }

    // Overview filtered by patientId (call this when the frontend knows the user is a patient)
    @GetMapping("/patient/{patientId}/overview")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public AnalyticsOverviewDto overviewByPatient(
            @PathVariable Long patientId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return medicalReportService.getOverview(from, to, null, patientId);
    }

    // Overview filtered by doctorId
    @GetMapping("/doctor/{doctorId}/overview")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO')")
    public AnalyticsOverviewDto overviewByDoctor(
            @PathVariable Long doctorId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return medicalReportService.getOverview(from, to, doctorId, null);
    }

    // Monthly trends for all (admin/segretaria)
    @GetMapping("/monthly")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA')")
    public List<MonthlyRevenueDto> monthlyAll(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return medicalReportService.getMonthlyRevenue(from, to, null, null);
    }

    // Monthly trends by patient
    @GetMapping("/patient/{patientId}/monthly")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO','PAZIENTE')")
    public List<MonthlyRevenueDto> monthlyByPatient(
            @PathVariable Long patientId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return medicalReportService.getMonthlyRevenue(from, to, null, patientId);
    }

    // Monthly trends by doctor
    @GetMapping("/doctor/{doctorId}/monthly")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO')")
    public List<MonthlyRevenueDto> monthlyByDoctor(
            @PathVariable Long doctorId,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return medicalReportService.getMonthlyRevenue(from, to, doctorId, null);
    }

    // Revenue by doctor (top N) - for admin/segretaria; doctors can call for full list too
    @GetMapping("/by-doctor")
    @PreAuthorize("hasAnyRole('ADMIN','SEGRETERIA','MEDICO')")
    public List<DoctorRevenueDto> byDoctor(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(name = "patientId", required = false) Long patientId,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit
    ) {
        return medicalReportService.getRevenueByDoctor(from, to, patientId, limit);
    }
}
