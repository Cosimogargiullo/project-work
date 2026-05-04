package it.carehub.common.user.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class RegisterUserRequest {
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String password;
    private String phone;
    private String fiscalCode;
    private LocalDate birthDate;
    private String specialization;
    private Set<String> roles;

}
