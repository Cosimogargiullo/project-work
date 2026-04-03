package it.carehub.report.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@Table(name = "medical_report", schema = "carehub")
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "medical_report_seq")
    @SequenceGenerator(name = "medical_report_seq", sequenceName = "carehub.seq_medical_report", allocationSize = 1)
    @Column(name = "id", nullable = false)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "appointment_id", nullable = false, unique = true)
    private Long appointmentId;

    @Column(name = "summary")
    private String summary;

    @Column(name = "notes")
    private String notes;

    @Column(name = "cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal cost;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "pdf_content", nullable = false)
    @JsonIgnore
    private byte[] pdfContent;

    @Column(name = "report_date", nullable = false)
    private LocalDateTime reportDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
