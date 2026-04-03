package it.carehub.user.application.service;

import it.carehub.common.user.model.Specialization;
import it.carehub.common.utils.SimpleResult;
import it.carehub.user.domain.model.Role;
import it.carehub.user.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Centralizes user data validation logic.
 * Provides common validation methods for registration and update operations.
 */
@Service
public class UserValidationService {

    private static final String FISCAL_CODE_REGEX = "^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$";
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$";

    private final UserRepository userRepository;

    public UserValidationService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Validates fiscal code format.
     *
     * @param fiscalCode the fiscal code to validate
     * @return true if the format is valid
     */
    public boolean isFiscalCodeFormatValid(String fiscalCode) {
        return fiscalCode != null && fiscalCode.matches(FISCAL_CODE_REGEX);
    }

    /**
     * Validates email format.
     *
     * @param email the email to validate
     * @return true if the format is valid
     */
    public boolean isEmailFormatValid(String email) {
        return email == null || email.trim().isEmpty() || email.matches(EMAIL_REGEX);
    }

    /**
     * Validates birth date is not in the future.
     *
     * @param birthDate the birth date to validate
     * @return true if the date is valid (not in future)
     */
    public boolean isBirthDateValid(LocalDate birthDate) {
        return birthDate == null || !birthDate.isAfter(LocalDate.now());
    }

    /**
     * Validates specialization value.
     *
     * @param specialization the specialization string to validate
     * @return true if valid or empty
     */
    public boolean isSpecializationValid(String specialization) {
        if (specialization == null || specialization.trim().isEmpty()) {
            return true;
        }
        try {
            Specialization.valueOf(specialization.trim().toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Checks if a username already exists (excluding the specified user ID).
     *
     * @param username the username to check
     * @param excludeUserId the user ID to exclude from check (null if checking for registration)
     * @return true if username is available
     */
    public boolean isUsernameAvailable(String username, Long excludeUserId) {
        return userRepository.findByUsername(username)
                .map(existing -> excludeUserId != null && existing.getId().equals(excludeUserId))
                .orElse(true);
    }

    /**
     * Checks if an email already exists (excluding the specified user ID).
     *
     * @param email the email to check
     * @param excludeUserId the user ID to exclude from check (null if checking for registration)
     * @return true if email is available
     */
    public boolean isEmailAvailable(String email, Long excludeUserId) {
        if (email == null || email.trim().isEmpty()) {
            return true;
        }
        return userRepository.findByEmail(email)
                .map(existing -> excludeUserId != null && existing.getId().equals(excludeUserId))
                .orElse(true);
    }

    /**
     * Checks if a fiscal code already exists (excluding the specified user ID).
     *
     * @param fiscalCode the fiscal code to check
     * @param excludeUserId the user ID to exclude from check (null if checking for registration)
     * @return true if fiscal code is available
     */
    public boolean isFiscalCodeAvailable(String fiscalCode, Long excludeUserId) {
        if (fiscalCode == null || fiscalCode.trim().isEmpty()) {
            return true;
        }
        return userRepository.findByFiscalCode(fiscalCode.toUpperCase())
                .map(existing -> excludeUserId != null && existing.getId().equals(excludeUserId))
                .orElse(true);
    }

    /**
     * Validates a user DTO for common fields.
     * This is a generic validation method used by both registration and update.
     * firstName, lastName, phone are optional fields.
     *
     * @param username the username to validate (required)
     * @param email the email to validate (optional)
     * @param fiscalCode the fiscal code to validate (required)
     * @param firstName the first name to validate (optional)
     * @param lastName the last name to validate (optional)
     * @param phone the phone to validate (optional)
     * @param birthDate the birth date to validate (optional)
     * @param specialization the specialization to validate (optional)
     * @param excludeUserId the user ID to exclude from uniqueness checks (null for registration)
     * @param result the result object to populate with error messages
     * @return true if all validations pass
     */
    public boolean validateUserFields(
            String username,
            String email,
            String fiscalCode,
            String firstName,
            String lastName,
            String phone,
            LocalDate birthDate,
            String specialization,
            Long excludeUserId,
            SimpleResult result) {

        // Required fields validation
        if (fiscalCode == null || fiscalCode.trim().isEmpty()) {
            result.failure("Codice Fiscale obbligatorio");
            return false;
        }
        if (username == null || username.trim().isEmpty()) {
            result.failure("Username obbligatorio");
            return false;
        }

        // Format validation
        if (!isFiscalCodeFormatValid(fiscalCode)) {
            result.failure("Formato codice fiscale non valido");
            return false;
        }

        if (email != null && !email.trim().isEmpty() && !isEmailFormatValid(email)) {
            result.failure("Formato email non valido");
            return false;
        }

        if (birthDate != null && !isBirthDateValid(birthDate)) {
            result.failure("La data di nascita non può essere nel futuro");
            return false;
        }

        if (!isSpecializationValid(specialization)) {
            result.failure("Specializzazione non valida");
            return false;
        }

        // Uniqueness validation
        if (!isUsernameAvailable(username.trim(), excludeUserId)) {
            result.failure("Username già esistente");
            return false;
        }

        if (!isEmailAvailable(email, excludeUserId)) {
            result.failure("Email già esistente");
            return false;
        }

        if (!isFiscalCodeAvailable(fiscalCode.toUpperCase(), excludeUserId)) {
            result.failure("Codice fiscale già esistente");
            return false;
        }

        return true;
    }

    /**
     * Validates a user DTO for registration (includes password validation).
     *
     * @param username the username to validate
     * @param email the email to validate
     * @param fiscalCode the fiscal code to validate
     * @param firstName the first name to validate
     * @param lastName the last name to validate
     * @param phone the phone to validate
     * @param password the password to validate
     * @param birthDate the birth date to validate
     * @param result the result object to populate with error messages
     * @return true if all validations pass
     */
    public boolean validateForRegistration(
            String username,
            String email,
            String fiscalCode,
            String firstName,
            String lastName,
            String phone,
            String password,
            LocalDate birthDate,
            SimpleResult result) {

        // Password validation (only for registration)
        if (password == null || password.trim().isEmpty()) {
            result.failure("Password obbligatoria");
            return false;
        }

        // Validate common fields without specialization (optional in registration)
        return validateUserFields(username, email, fiscalCode, firstName, lastName, phone, birthDate, null, null, result);
    }

    /**
     * Validates a user DTO for update (excludes password, includes user ID for uniqueness checks).
     *
     * @param userId the ID of the user being updated
     * @param username the username to validate
     * @param email the email to validate
     * @param fiscalCode the fiscal code to validate
     * @param firstName the first name to validate
     * @param lastName the last name to validate
     * @param phone the phone to validate
     * @param birthDate the birth date to validate
     * @param specialization the specialization to validate
     * @param result the result object to populate with error messages
     * @return true if all validations pass
     */
    public boolean validateForUpdate(
            Long userId,
            String username,
            String email,
            String fiscalCode,
            String firstName,
            String lastName,
            String phone,
            LocalDate birthDate,
            String specialization,
            SimpleResult result) {

        return validateUserFields(username, email, fiscalCode, firstName, lastName, phone, birthDate, specialization, userId, result);
    }

    /**
     * Converts a collection of role strings to a set of Role enums.
     * Handles validation and error reporting.
     *
     * @param roleStrings the role strings to convert
     * @param result the result object to populate with error messages
     * @return the set of converted roles, or null if conversion fails
     */
    public Set<Role> convertToRoles(Set<String> roleStrings, SimpleResult result) {
        if (roleStrings == null || roleStrings.isEmpty()) {
            return Collections.emptySet();
        }

        try {
            return roleStrings.stream()
                    .filter(r -> r != null && !r.isBlank())
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .map(Role::valueOf)
                    .collect(Collectors.toSet());
        } catch (IllegalArgumentException ex) {
            result.failure("Uno o più ruoli non sono validi");
            return null;
        }
    }

    /**
     * Validates and converts a specialization string to a Specialization enum.
     *
     * @param specializationStr the specialization string to convert
     * @param result the result object to populate with error messages
     * @return the converted Specialization, or null if conversion fails
     */
    public Specialization convertToSpecialization(String specializationStr, SimpleResult result) {
        if (specializationStr == null || specializationStr.trim().isEmpty()) {
            return null;
        }

        try {
            return Specialization.valueOf(specializationStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            result.failure("Specializzazione non valida");
            return null;
        }
    }
}






