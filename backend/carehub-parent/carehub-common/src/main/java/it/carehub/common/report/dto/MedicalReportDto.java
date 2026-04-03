package it.carehub.common.report.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReportDto {
    @NotNull
    private Long patientId;
    @NotNull
    private Long doctorId;
    private Long appointmentId; // optional link to appointment
    @NotNull
    private LocalDateTime reportDate;
    @NotNull
    @Size(max = 2000)
    private String content;
}
