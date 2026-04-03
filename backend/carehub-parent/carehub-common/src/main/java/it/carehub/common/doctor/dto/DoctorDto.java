package it.carehub.common.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class DoctorDto {
    private Long userId;
    
    @NotBlank
    @Size(max = 50)
    private String firstName;
    @NotBlank
    @Size(max = 50)
    private String lastName;
    private Long specializationId;
    @Email
    @Size(max = 100)
    private String email;
    @Size(max = 20)
    private String phone;
    private Boolean active;
}
