package it.carehub.common.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class DoctorFilter {
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String phone;
    private String specialization;

    private Boolean active;
}
