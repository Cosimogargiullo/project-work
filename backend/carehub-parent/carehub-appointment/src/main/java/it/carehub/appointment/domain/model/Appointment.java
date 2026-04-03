package it.carehub.appointment.domain.model;

import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.appointment.model.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@Table(name = "appointment", schema = "carehub")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "appointment_seq")
    @SequenceGenerator(name = "appointment_seq", sequenceName = "carehub.seq_appointment", allocationSize = 1)
    @Column(name = "id", nullable = false)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "availability_id")
    private Long availabilityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "visit_type", nullable = false, columnDefinition = "carehub.visit_type")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private VisitType visitType;

    @Column(name = "appointment_day", nullable = false)
    private LocalDate appointmentDay;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "carehub.appointment_status")
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private AppointmentStatus status;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
