package it.carehub.auth.application.service;

import it.carehub.common.utils.SimpleResult;
import it.carehub.common.user.dto.RegisterUserRequest;
import org.springframework.http.ResponseEntity;
import it.carehub.auth.api.AuthController.LoginRequest;

public interface AuthUserService {
    ResponseEntity<SimpleResult> register(RegisterUserRequest request, Boolean isPatient);
    ResponseEntity<?> login(LoginRequest request);
}
