package it.carehub.application.api;

import it.carehub.report.api.controller.MedicalReportController;
import it.carehub.report.application.service.MedicalReportService;
import it.carehub.report.domain.model.MedicalReport;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MedicalReportControllerOwnershipIT {

        @Test
        void patientCannotReadAnotherPatientReport() {
                MedicalReportService medicalReportService = mock(MedicalReportService.class);
                MedicalReportController controller = new MedicalReportController(medicalReportService);

                MedicalReport report = sampleReport(77L, 2L);
                when(medicalReportService.findById(77L)).thenReturn(Optional.of(report));

                HttpStatus status = HttpStatus.valueOf(controller.getById(77L, patientAuth(1L)).getStatusCode().value());
                assertEquals(HttpStatus.FORBIDDEN, status);
        }

        @Test
        void patientCanReadOwnReport() {
                MedicalReportService medicalReportService = mock(MedicalReportService.class);
                MedicalReportController controller = new MedicalReportController(medicalReportService);

                MedicalReport report = sampleReport(77L, 1L);
                when(medicalReportService.findById(77L)).thenReturn(Optional.of(report));

                HttpStatus status = HttpStatus.valueOf(controller.getById(77L, patientAuth(1L)).getStatusCode().value());
                assertEquals(HttpStatus.OK, status);
        }

        private MedicalReport sampleReport(Long id, Long patientId) {
                return MedicalReport.builder()
                                .id(id)
                                .patientId(patientId)
                                .doctorId(11L)
                                .appointmentId(100L)
                                .summary("Summary")
                                .notes("Notes")
                                .cost(BigDecimal.TEN)
                                .fileName("referto.pdf")
                                .contentType("application/pdf")
                                .pdfContent(new byte[]{1, 2, 3})
                                .reportDate(LocalDateTime.now())
                                .createdAt(LocalDateTime.now())
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
