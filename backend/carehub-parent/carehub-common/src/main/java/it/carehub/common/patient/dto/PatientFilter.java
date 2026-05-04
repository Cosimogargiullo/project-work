package it.carehub.common.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class PatientFilter {
    private String firstName;
    private String lastName;
    private String fiscalCode;
    private LocalDate birthDateFrom;
    private LocalDate birthDateTo;
    private String email;
    private String phone;
    private Long userId;
    private LocalDateTime createdAtFrom;
    private LocalDateTime createdAtTo;
}
