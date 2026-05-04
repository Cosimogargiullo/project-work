package it.carehub.common.appointment.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDto {
    @NotNull
    private Long patientId;
    @NotNull
    private Long doctorId;
    @NotNull
    private Long visitTypeId;
    @NotNull
    @FutureOrPresent
    private LocalDateTime appointmentDate;
    @NotNull
    @Size(max = 30)
    private String status; // match enum values in DDL
    @Size(max = 500)
    private String notes;
}
