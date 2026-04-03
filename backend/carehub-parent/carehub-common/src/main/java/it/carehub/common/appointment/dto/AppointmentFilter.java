package it.carehub.common.appointment.dto;

import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.appointment.model.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentFilter {
    private Long patientId;
    private Long doctorId;
    private VisitType visitType;
    private LocalDate fromDate;
    private LocalDate toDate;
    private AppointmentStatus status;
}
