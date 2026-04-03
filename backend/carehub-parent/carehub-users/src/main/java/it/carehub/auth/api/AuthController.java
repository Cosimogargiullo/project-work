package it.carehub.auth.api;

import it.carehub.auth.application.service.AuthUserService;
import it.carehub.common.user.dto.RegisterUserRequest;
import it.carehub.common.utils.SimpleResult;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthUserService authUserService;

    public AuthController(AuthUserService authUserService) {
        this.authUserService = authUserService;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record LoginResponse(String accessToken) {}

    /**
     * Handles user login by delegating to the AuthUserService.
     * @param request the login request containing username and password
     * @return ResponseEntity with access token or 401 status
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return authUserService.login(request);
    }

    @PostMapping("/register")
    public ResponseEntity<SimpleResult> register(@RequestBody RegisterUserRequest request) {
        return authUserService.register(request, false);
    }

    @PostMapping("/register-patient")
    public ResponseEntity<SimpleResult> registerPatient(@RequestBody RegisterUserRequest request) {
        return authUserService.register(request, true);
    }

    /**
     * Permette la registrazione specificando esplicitamente i ruoli da assegnare.
     * Se il payload non contiene ruoli, verranno applicate le regole di default
     * (medico se isPatient è false, paziente se isPatient è true).
     */
    @PostMapping("/register-user")
    public ResponseEntity<SimpleResult> registerUser(@RequestBody RegisterUserRequest request) {
        return authUserService.register(request, null);
    }
}
