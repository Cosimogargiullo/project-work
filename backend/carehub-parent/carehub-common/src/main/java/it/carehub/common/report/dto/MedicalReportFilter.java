package it.carehub.common.report.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReportFilter {
    private Long patientId;
    private Long doctorId;
    private Long appointmentId;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}
