package it.carehub.user.application.service;

import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.doctor.dto.DoctorFilter;
import it.carehub.common.exception.InternalServerException;
import it.carehub.common.user.dto.UpdateUserRequest;
import it.carehub.common.utils.SimpleResult;
import it.carehub.common.user.model.Specialization;
import it.carehub.common.user.dto.RegisterUserRequest;
import it.carehub.common.appointment.port.AppointmentManagementPort;
import it.carehub.common.availability.port.AvailabilityManagementPort;
import it.carehub.common.report.port.MedicalReportManagementPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import it.carehub.user.domain.model.User;
import it.carehub.user.domain.model.Role;
import it.carehub.user.domain.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@Slf4j
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;
    private final UserValidationService validationService;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentManagementPort appointmentManagementPort;
    private final AvailabilityManagementPort availabilityManagementPort;
    private final MedicalReportManagementPort medicalReportManagementPort;

    @PersistenceContext
    private EntityManager entityManager;

    public UserService(UserRepository userRepository,
                       UserValidationService validationService,
                       PasswordEncoder passwordEncoder,
                       AppointmentManagementPort appointmentManagementPort,
                       AvailabilityManagementPort availabilityManagementPort,
                       MedicalReportManagementPort medicalReportManagementPort) {
        this.userRepository = userRepository;
        this.validationService = validationService;
        this.passwordEncoder = passwordEncoder;
        this.appointmentManagementPort = appointmentManagementPort;
        this.availabilityManagementPort = availabilityManagementPort;
        this.medicalReportManagementPort = medicalReportManagementPort;
    }

    /**
     * Registra un nuovo utente nel sistema dopo aver validato i dati forniti.
     * Il ruolo viene assegnato in base al flag {@code isPatient} e ai ruoli presenti nella request.
     *
     * @param request   dati di registrazione (username, email, password, codice fiscale, ecc.)
     * @param isPatient se {@code true} assegna il ruolo PAZIENTE; se {@code false} usa i ruoli dalla request
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult createUser(RegisterUserRequest request, Boolean isPatient) {
        SimpleResult result = new SimpleResult();

        if (request == null) {
            return result.failure("Richiesta di registrazione non valida");
        }

        if (validationService.validateForRegistration(
                request.getUsername(),
                request.getEmail(),
                request.getFiscalCode(),
                request.getFirstName(),
                request.getLastName(),
                request.getPhone(),
                request.getPassword(),
                request.getBirthDate(),
                result)) {
            try {
                Set<Role> targetRoles = resolveRoles(request, isPatient, result);
                if (targetRoles == null || targetRoles.isEmpty()) {
                    return result;
                }

                User.UserBuilder userBuilder = User.builder()
                    .username(request.getUsername().trim())
                    .fiscalCode(request.getFiscalCode().toUpperCase())
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .active(true)
                    .roles(targetRoles);

                if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
                    userBuilder.firstName(request.getFirstName().trim());
                }
                if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
                    userBuilder.lastName(request.getLastName().trim());
                }
                if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                    userBuilder.email(request.getEmail().trim());
                }
                if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
                    userBuilder.phone(request.getPhone().trim());
                }
                if (request.getBirthDate() != null) {
                    userBuilder.birthDate(request.getBirthDate());
                }

                if (request.getSpecialization() != null && !request.getSpecialization().trim().isEmpty()) {
                    if (targetRoles != null && targetRoles.contains(Role.MEDICO)) {
                        Specialization specialization = validationService.convertToSpecialization(request.getSpecialization(), result);
                        if (specialization == null) {
                            return result;
                        }
                        userBuilder.specialization(specialization);
                    }
                }

                User createdUser = Objects.requireNonNull(userBuilder.build(), "Generated user cannot be null");
                userRepository.save(createdUser);
                return result.success("Registrazione completata con successo");
            } catch (Exception e) {
                log.error("[UserService] createUser - internal error", e);
                throw new InternalServerException("Errore interno durante la registrazione", e);
            }
        } else {
            return result;
        }
    }

    /**
     * Restituisce tutti gli utenti, opzionalmente filtrati per stato di attivazione.
     *
     * @param active se {@code null} restituisce tutti; se {@code true}/{@code false} filtra per stato
     * @return lista di utenti
     */
    public List<User> getAllUsers(Boolean active) {
        if (active == null) {
            return userRepository.findAll();
        }
        return userRepository.findByActive(active);
    }

    /**
     * Recupera un utente per identificativo.
     *
     * @param id identificativo dell'utente
     * @return {@link Optional} contenente l'utente se trovato, vuoto se {@code id == null} o non esistente
     */
    public Optional<User> getUserById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return userRepository.findById(id);
    }

    /**
     * Ricerca medici per testo libero su nome, cognome, username o email.
     * Se la stringa di ricerca è vuota o nulla, restituisce tutti i medici.
     *
     * @param search stringa di ricerca (opzionale)
     * @return lista di utenti con ruolo MEDICO che corrispondono alla ricerca
     */
    public List<User> searchDoctors(String search) {
        if (search == null || search.trim().isEmpty()) {
            return userRepository.findAllByRole(Role.MEDICO);
        }
        return userRepository.searchDoctors(search.trim(), Role.MEDICO);
    }

    /**
     * Ricerca pazienti per testo libero su nome, cognome, username o email.
     * Se la stringa di ricerca è vuota o nulla, restituisce tutti i pazienti.
     *
     * @param search stringa di ricerca (opzionale)
     * @return lista di utenti con ruolo PAZIENTE che corrispondono alla ricerca
     */
    public List<User> searchPatients(String search) {
        if (search == null || search.trim().isEmpty()) {
            return userRepository.findAllByRole(Role.PAZIENTE);
        }
        return userRepository.searchDoctors(search.trim(), Role.PAZIENTE);
    }

    /**
     * Ricerca medici per testo libero filtrati per specializzazione derivata dal tipo di visita.
     * Se il {@code visitType} è {@code null} o non ha una specializzazione associata,
     * la ricerca viene eseguita senza filtro di specializzazione.
     *
     * @param search    stringa di ricerca su nome/cognome/username del medico
     * @param visitType tipo di visita da cui derivare la specializzazione del medico (opzionale)
     * @return lista di medici corrispondenti
     */
    public List<User> searchDoctorsByVisitType(String search, VisitType visitType) {
        if (search == null) {
            return List.of();
        }

        Specialization specialization = visitType != null ? visitType.getSpecialization() : null;
        if (specialization == null) {
            return userRepository.searchDoctors(search.trim(), Role.MEDICO);
        }

        return userRepository.searchDoctorsBySpecialization(search.trim(), Role.MEDICO, specialization);
    }

    /**
     * Applica un filtro avanzato sui medici tramite Criteria API.
     * Supporta filtri testuali (OR su nome/cognome/username/email), telefono, specializzazione e stato.
     *
     * @param filter criteri di ricerca; se {@code null} viene trattato come filtro vuoto
     * @return lista di utenti con ruolo MEDICO che soddisfano i criteri
     */
    public List<User> filterDoctors(DoctorFilter filter) {
        if (filter == null) {
            filter = new DoctorFilter();
        }

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);

        Join<User, Role> rolesJoin = root.join("roles");

        // Predicato fisso: solo utenti con ruolo MEDICO
        Predicate rolePredicate = cb.equal(rolesJoin, Role.MEDICO);

        // Predicati di testo (nome, cognome, username, email) combinati in OR
        List<Predicate> textPredicates = new ArrayList<>();
        if (filter.getFirstName() != null && !filter.getFirstName().isBlank()) {
            textPredicates.add(cb.like(cb.lower(root.get("firstName")), "%" + filter.getFirstName().toLowerCase() + "%"));
        }
        if (filter.getLastName() != null && !filter.getLastName().isBlank()) {
            textPredicates.add(cb.like(cb.lower(root.get("lastName")), "%" + filter.getLastName().toLowerCase() + "%"));
        }
        if (filter.getUsername() != null && !filter.getUsername().isBlank()) {
            textPredicates.add(cb.like(cb.lower(root.get("username")), "%" + filter.getUsername().toLowerCase() + "%"));
        }
        if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
            textPredicates.add(cb.like(cb.lower(root.get("email")), "%" + filter.getEmail().toLowerCase() + "%"));
        }

        // Altri predicati (telefono, specializzazione, clinica, active) combinati in AND
        List<Predicate> otherPredicates = new ArrayList<>();
        if (filter.getPhone() != null && !filter.getPhone().isBlank()) {
            otherPredicates.add(cb.like(cb.lower(root.get("phone")), "%" + filter.getPhone().toLowerCase() + "%"));
        }
        if (filter.getSpecialization() != null && !filter.getSpecialization().isBlank()) {
            try {
                Specialization spec = Specialization.valueOf(filter.getSpecialization().toUpperCase());
                otherPredicates.add(cb.equal(root.get("specialization"), spec));
            } catch (IllegalArgumentException ex) {
                log.warn("[UserService] filterDoctors - unrecognized specialization='{}', filter ignored", filter.getSpecialization());
            }
        }
        // clinicId removed from User entity; ignore this filter
        if (filter.getActive() != null) {
            otherPredicates.add(cb.equal(root.get("active"), filter.getActive()));
        }

        Predicate finalPredicate = rolePredicate;

        if (!textPredicates.isEmpty()) {
            Predicate orText = cb.or(textPredicates.toArray(new Predicate[0]));
            finalPredicate = cb.and(finalPredicate, orText);
        }

        if (!otherPredicates.isEmpty()) {
            Predicate andOthers = cb.and(otherPredicates.toArray(new Predicate[0]));
            finalPredicate = cb.and(finalPredicate, andOthers);
        }

        cq.select(root).distinct(true).where(finalPredicate);

        return entityManager.createQuery(cq).getResultList();
    }

    /**
     * Aggiorna il profilo di un utente esistente dopo aver validato i nuovi dati.
     *
     * @param id      identificativo dell'utente da aggiornare
     * @param request dati di aggiornamento
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult updateUser(Long id, UpdateUserRequest request) {
        SimpleResult result = new SimpleResult();

        if (id == null) {
            return result.failure("Id utente obbligatorio");
        }

        if (request == null) {
            return result.failure("Richiesta di aggiornamento non valida");
        }

        Optional<User> existingOpt = userRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return result.failure("Utente non trovato");
        }

        if (!validationService.validateForUpdate(
                id,
                request.getUsername(),
                request.getEmail(),
                request.getFiscalCode(),
                request.getFirstName(),
                request.getLastName(),
                request.getPhone(),
                request.getBirthDate(),
                request.getSpecialization(),
                result)) {
            return result;
        }

        try {
            User user = existingOpt.get();

            if (!applyUpdateFields(user, request, result)) {
                return result;
            }

            userRepository.save(Objects.requireNonNull(user, "User cannot be null"));
            return result.success("Profilo aggiornato correttamente");
        } catch (Exception ex) {
            log.error("[UserService] updateUser - internal error id={}", id, ex);
            throw new InternalServerException("Errore interno durante l'aggiornamento del profilo", ex);
        }
    }

    /**
     * Applica i campi dell'UpdateUserRequest sull'entità User.
     * Restituisce false se la conversione di ruoli o specializzazione fallisce (result contiene l'errore).
     */
    private boolean applyUpdateFields(User user, UpdateUserRequest request, SimpleResult result) {
        // Update required fields
        user.setUsername(request.getUsername().trim());
        user.setFiscalCode(request.getFiscalCode().trim().toUpperCase());

        // Update optional fields with null-safety
        if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
            user.setLastName(request.getLastName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user.setEmail(request.getEmail().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getBirthDate() != null) {
            user.setBirthDate(request.getBirthDate());
        }

        // Aggiornamento ruoli opzionale (per eventuali usi amministrativi)
        if (request.getRoles() != null) {
            Set<Role> roles = validationService.convertToRoles(request.getRoles(), result);
            if (roles == null) {
                return false;
            }
            user.setRoles(roles);
        }

        // Aggiorna specializzazione solo se l'utente ha ruolo MEDICO
        if (request.getSpecialization() != null && !request.getSpecialization().trim().isEmpty()) {
            if (user.getRoles() != null && user.getRoles().contains(Role.MEDICO)) {
                Specialization specialization = validationService.convertToSpecialization(request.getSpecialization(), result);
                if (specialization == null) {
                    return false;
                }
                user.setSpecialization(specialization);
            }
        }

        return true;
    }

    /**
     * Determina i ruoli da assegnare all'utente durante la registrazione.
     */
    private Set<Role> resolveRoles(RegisterUserRequest request, Boolean isPatient, SimpleResult result) {
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            return validationService.convertToRoles(request.getRoles(), result);
        }

        return Boolean.TRUE.equals(isPatient) ? Set.of(Role.PAZIENTE) : Set.of(Role.MEDICO);
    }

    /**
     * Disattiva un utente (soft-delete) e rimuove gli appuntamenti e le disponibilità ad esso associati.
     * L'utente resta nel database ma non è più attivo.
     *
     * @param id identificativo dell'utente da disattivare
     * @return {@link SimpleResult} con esito dell'operazione
     */
    @Transactional
    public SimpleResult softDeleteUser(Long id) {
        SimpleResult result = new SimpleResult();

        if (id == null) {
            return result.failure("Id utente obbligatorio");
        }

        return userRepository.findById(id)
                .map(user -> {
                    user.setActive(false);
                    userRepository.save(user);

                    // Rimuovi definitivamente appuntamenti e disponibilità associati all'utente
                    // Per sicurezza, inoltriamo le richieste di cancellazione tramite i port/facade;
                    // se non ci sono record associati, i facade li ignoreranno.
                    try {
                        appointmentManagementPort.deleteByDoctorId(id);
                        appointmentManagementPort.deleteByPatientId(id);
                        availabilityManagementPort.deleteByDoctorId(id);
                    } catch (Exception ex) {
                        // Log e non bloccare la disattivazione in caso di errori secondari
                        // (l'operazione primaria è la disattivazione dell'utente)
                    }

                    return result.success("Utente disattivato correttamente");
                })
                .orElseGet(() -> result.failure("Utente non trovato"));
    }

    /**
     * Riattiva un utente precedentemente disattivato e ripristina i suoi appuntamenti.
     *
     * @param id identificativo dell'utente da riattivare
     * @return {@link SimpleResult} con esito dell'operazione
     */
    @Transactional
    public SimpleResult reactivateUser(Long id) {
        SimpleResult result = new SimpleResult();

        if (id == null) {
            return result.failure("Id utente obbligatorio");
        }

        return userRepository.findById(id)
                .map(user -> {
                    user.setActive(true);
                    userRepository.save(user);
                    // Reactivate associated appointments
                    try {
                        appointmentManagementPort.reactivateByDoctorId(id);
                        appointmentManagementPort.reactivateByPatientId(id);
                    } catch (Exception ex) {
                        // Log and continue: primary operation is reactivating the user
                    }

                    return result.success("Utente riattivato correttamente");
                })
                .orElseGet(() -> result.failure("Utente non trovato"));
    }

    /**
     * Elimina definitivamente un utente e tutti i dati operativi associati (appuntamenti, disponibilità, referti).
     * L'utente deve essere già disattivato prima della cancellazione definitiva.
     *
     * @param id identificativo dell'utente da eliminare
     * @return {@link SimpleResult} con esito dell'operazione
     */
    @Transactional
    public SimpleResult hardDeleteUser(Long id) {
        SimpleResult result = new SimpleResult();

        if (id == null) {
            return result.failure("Id utente obbligatorio");
        }

        return userRepository.findById(id)
                .map(user -> {
                    if (Boolean.TRUE.equals(user.getActive())) {
                        return result.failure("Impossibile eliminare definitivamente un utente ancora attivo. Disattivarlo prima.");
                    }

                    // Elimina tutti i dati operativi associati tramite i facade/port
                    // qui vogliamo la cancellazione definitiva: usiamo i metodi permanenti
                    appointmentManagementPort.deletePermanentlyByDoctorId(id);
                    appointmentManagementPort.deletePermanentlyByPatientId(id);
                    availabilityManagementPort.deleteByDoctorId(id);
                    medicalReportManagementPort.deleteByDoctorId(id);
                    medicalReportManagementPort.deleteByPatientId(id);

                    userRepository.delete(user);
                    return result.success("Utente eliminato definitivamente insieme ai dati associati");
                })
                .orElseGet(() -> result.failure("Utente non trovato"));
    }

    /**
     * Restituisce i tipi di visita erogati da un medico, ricavati dalla sua specializzazione.
     *
     * @param id identificativo del medico
     * @return lista di {@link VisitType} associati alla specializzazione del medico;
     *         lista vuota se {@code id == null} o il medico non ha specializzazione
     */
    public List<VisitType> getVisitTypesByDoctorId(Long id) {
        if (id == null) {
            return List.of();
        }

        return userRepository.findById(id)
                .map(User::getSpecialization)
                .map(Enum::name)
                .map(VisitType::fromSpecialization)
                .map(List::of)
                .orElseGet(List::of);
    }
}
