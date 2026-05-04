package it.carehub.auth.application.service.impl;

import it.carehub.common.utils.SimpleResult;
import it.carehub.common.user.dto.RegisterUserRequest;
import it.carehub.user.domain.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import it.carehub.auth.application.service.AuthUserService;
import it.carehub.auth.api.AuthController.LoginRequest;
import it.carehub.auth.api.AuthController.LoginResponse;
import it.carehub.auth.application.security.JwtService;

@Service
@Slf4j
public class AuthUserServiceImpl implements AuthUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final it.carehub.user.application.service.UserService userService;

    public AuthUserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, it.carehub.user.application.service.UserService userService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    /**
     * Registers a new user or patient based on the isPatient flag.
     * Performs validation and handles all business logic for registration.
     *
     * @param request   the registration request data
     * @param isPatient true if the user is a patient, false otherwise
     * @return ResponseEntity with operation result
     */
    public ResponseEntity<SimpleResult> register(RegisterUserRequest request, Boolean isPatient) {
        return ResponseEntity.ok(userService.createUser(request, isPatient));
    }

    /**
     * Determina i ruoli da assegnare all'utente. Se il payload specifica dei ruoli,
     * vengono validati e utilizzati; in caso contrario si applicano i default basati su isPatient.
     */
    // role resolution is delegated to UserService

    /**
     * Handles user login: validates credentials and generates JWT token if successful.
     *
     * @param request the login request containing username and password
     * @return ResponseEntity with access token or 401 status
     */
    @Override
    public ResponseEntity<?> login(LoginRequest request) {
        String identifier = request.username();
        log.info("Login attempt for identifier (username or CF): {}", identifier);

        // Prima tentativo con username, se non trovato prova con codice fiscale
        var userOpt = userRepository.findByUsername(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByFiscalCode(identifier.toUpperCase());
        }

        if (userOpt.isEmpty()) {
            log.warn("Login failed: user not found for identifier (username or CF): {}", identifier);
            return ResponseEntity.status(401).build();
        }

        var user = userOpt.get();
        if (user.getActive() != null && !user.getActive()) {
            log.warn("Login failed: user inactive for identifier: {}", identifier);
            SimpleResult res = new SimpleResult().failure("Utente disabilitato");
            return ResponseEntity.status(403).body(res);
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Login failed: invalid credentials for identifier (username or CF): {}", identifier);
            return ResponseEntity.status(401).build();
        }
        var claims = new java.util.HashMap<String, Object>();
        claims.put("userId", user.getId());
        claims.put("roles", user.getRoles().stream().map(Enum::name).toList());
        var token = jwtService.generateToken(String.valueOf(user.getId()), user.getUsername(), claims);
        log.info("Login successful for username: {}", user.getUsername());
        return ResponseEntity.ok(new LoginResponse(token));
    }
}
