package it.carehub.availability.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "available_dates")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AvailableDate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "available_day", nullable = false)
    private LocalDate availableDay;

    @Column(name = "available_time", nullable = false)
    private LocalTime availableTime;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Valori ammessi: MIN_60 (enum PostgreSQL availability_duration)
    @Builder.Default
    @Column(name = "duration_minutes", nullable = false, columnDefinition = "carehub.availability_duration")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private AvailabilityDuration durationMinutes = AvailabilityDuration.MIN_60;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Builder.Default
    @Column(name = "is_booked", nullable = false)
    private boolean isBooked = false;

}