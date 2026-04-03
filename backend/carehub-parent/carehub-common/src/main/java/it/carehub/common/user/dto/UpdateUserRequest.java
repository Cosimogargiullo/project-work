package it.carehub.common.user.dto;


import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String phone;
    private String fiscalCode;
    private LocalDate birthDate;
    private Set<String> roles;
    private String specialization;
}
