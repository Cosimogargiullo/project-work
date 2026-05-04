package it.carehub.user.api;

import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.user.dto.UpdateUserRequest;
import it.carehub.common.utils.SimpleResult;
import it.carehub.user.application.service.UserService;
import it.carehub.user.domain.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getAllUsers(@RequestParam(name = "active", required = false) Boolean active) {
        return userService.getAllUsers(active);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/visit-type")
    public List<VisitType> getVisitTypeByDoctorId(@PathVariable Long id) {
        return userService.getVisitTypesByDoctorId(id);
    }

    @GetMapping("/doctor-autocomplete")
    public List<User> doctorAutocomplete(@RequestParam("query") String query,
                                         @RequestParam(name = "visitType", required = false) String visitType) {

        if (visitType == null || visitType.isBlank()) {
            return userService.searchDoctors(query);
        }

        VisitType parsedVisitType;
        try {
            parsedVisitType = VisitType.valueOf(visitType);
        } catch (IllegalArgumentException ex) {
            return List.of();
        }

        return userService.searchDoctorsByVisitType(query, parsedVisitType);
    }

    @GetMapping("/patient-autocomplete")
    public List<User> patientAutocomplete(@RequestParam("query") String query) {
        return userService.searchPatients(query);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SimpleResult> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<SimpleResult> deleteUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.softDeleteUser(id));
    }

    @PostMapping("/{id}/reactivate")
    public ResponseEntity<SimpleResult> reactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.reactivateUser(id));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<SimpleResult> deleteUserPermanently(@PathVariable Long id) {
        return ResponseEntity.ok(userService.hardDeleteUser(id));
    }
}
