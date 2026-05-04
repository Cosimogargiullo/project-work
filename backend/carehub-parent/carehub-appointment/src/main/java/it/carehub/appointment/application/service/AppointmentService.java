package it.carehub.appointment.application.service;

import it.carehub.appointment.domain.model.Appointment;
import it.carehub.appointment.domain.repository.AppointmentRepository;
import it.carehub.common.appointment.dto.AppointmentFilter;
import it.carehub.common.appointment.model.AppointmentStatus;
import it.carehub.common.appointment.model.VisitType;
import it.carehub.common.availability.port.AvailabilityBookingPort;
import it.carehub.common.availability.port.dto.AvailabilityBookingResult;
import it.carehub.common.exception.InternalServerException;
import it.carehub.common.utils.SimpleResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppointmentService {

    private static final String APPOINTMENT_ALREADY_COMPLETED_MESSAGE = "La visita è già stata effettuata, non è possibile apportare modifiche";

    private final AppointmentRepository appointmentRepository;
    private final AvailabilityBookingPort availabilityBookingPort;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Restituisce tutti gli appuntamenti attivi.
     *
     * @return lista degli appuntamenti con {@code active = true}
     */
    public List<Appointment> findAll() {
        log.info("[AppointmentService] findAll - retrieving all appointments");
        return appointmentRepository.findAllByActiveTrue();
    }

    /**
     * Restituisce tutti i valori dell'enum {@link VisitType}.
     *
     * @return lista di tutti i tipi di visita supportati
     */
    public List<VisitType> getVisitTypes() {
        return List.of(VisitType.values());
    }

    /**
     * Restituisce tutti i valori dell'enum {@link AppointmentStatus}.
     *
     * @return lista di tutti gli stati di appuntamento supportati
     */
    public List<AppointmentStatus> getStatuses() {
        return List.of(AppointmentStatus.values());
    }

    /**
     * Recupera un appuntamento attivo per identificativo.
     *
     * @param id identificativo dell'appuntamento
     * @return {@link Optional} contenente l'appuntamento se attivo e trovato, vuoto altrimenti
     */
    public Optional<Appointment> findById(Long id) {
        log.info("[AppointmentService] findById - id={}", id);
        return appointmentRepository.findByIdAndActiveTrue(id);
    }

    /**
     * Recupera un appuntamento per identificativo, inclusi quelli con soft-delete.
     *
     * @param id identificativo dell'appuntamento
     * @return {@link Optional} contenente l'appuntamento se trovato (attivo o meno), vuoto se {@code id == null}
     */
    public Optional<Appointment> findByIdIncludingInactive(Long id) {
        log.info("[AppointmentService] findByIdIncludingInactive - id={}", id);
        if (id == null) {
            return Optional.empty();
        }
        return appointmentRepository.findById(id);
    }

    /**
     * Crea un nuovo appuntamento con validazione payload, controllo conflitti e prenotazione slot.
     *
     * @param appointment oggetto appuntamento da creare (senza id)
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult create(Appointment appointment) {
        SimpleResult result = new SimpleResult();
        log.info("[AppointmentService] create - payload received");
        Optional<SimpleResult> validation = validateAppointmentPayload(appointment, true, result);
        if (validation.isPresent()) {
            return validation.get();
        }

        Long availabilityId = appointment.getAvailabilityId();

        // Controllo non distruttivo: se lo slot non è attivo o è già prenotato, blocchiamo l'operazione
        if (availabilityId != null) {
            AvailabilityBookingResult check = availabilityBookingPort.checkSlot(availabilityId);
            if (!check.success()) {
                return result.failure(check.message());
            }
        }

        SimpleResult slotError = reserveSlotOrFailure(availabilityId, result);
        if (slotError != null) {
            return slotError;
        }

        try {
            Appointment saved = appointmentRepository.save(appointment);
            log.info("[AppointmentService] create - appointment {} created", saved.getId());
            return result.success("Appuntamento creato con successo");
        } catch (RuntimeException ex) {
            log.error("[AppointmentService] create - error while saving appointment", ex);
            throw new InternalServerException("Errore interno durante la creazione dell'appuntamento", ex);
        }
    }

    /**
     * Aggiorna un appuntamento esistente verificando payload, conflitti e cambio slot.
     * Non è possibile modificare appuntamenti già completati.
     *
     * @param id      identificativo dell'appuntamento da aggiornare
     * @param updated oggetto con i nuovi valori da applicare
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult update(Long id, Appointment updated) {
        SimpleResult result = new SimpleResult();

        log.info("[AppointmentService] update - id={} ", id);

        if (id == null) {
            return result.failure("L'id dell'appuntamento è obbligatorio");
        }

        Optional<SimpleResult> validation = validateAppointmentPayload(updated, false, result);
        if (validation.isPresent()) {
            return validation.get();
        }
        if (updated == null) {
            return result.failure("L'appuntamento non può essere null");
        }

        if (updated != null && updated.getId() != null && !Objects.equals(id, updated.getId())) {
            return result.failure("L'id del path e del payload devono coincidere");
        }

        return appointmentRepository.findById(id)
                .map(existing -> {
                    if (isAppointmentCompleted(existing)) {
                        return result.failure(APPOINTMENT_ALREADY_COMPLETED_MESSAGE);
                    }

                    Long previousAvailabilityId = existing.getAvailabilityId();
                    Long newAvailabilityId = updated.getAvailabilityId();
                    boolean availabilityChanged = !Objects.equals(previousAvailabilityId, newAvailabilityId);

                    // Verifica non distruttiva: blocca se lo slot non è attivo o è già prenotato
                    if (newAvailabilityId != null) {
                        AvailabilityBookingResult check = availabilityBookingPort.checkSlot(newAvailabilityId);
                        if (!check.success()) {
                            return result.failure(check.message());
                        }
                    }

                    if (availabilityChanged && newAvailabilityId != null) {
                        SimpleResult slotError = reserveSlotOrFailure(newAvailabilityId, result);
                        if (slotError != null) {
                            return slotError;
                        }
                    }

                    existing.setPatientId(updated.getPatientId());
                    existing.setDoctorId(updated.getDoctorId());
                    existing.setAvailabilityId(updated.getAvailabilityId());
                    existing.setVisitType(updated.getVisitType());
                    existing.setAppointmentDay(updated.getAppointmentDay());
                    existing.setAppointmentTime(updated.getAppointmentTime());
                    existing.setStatus(updated.getStatus());
                    existing.setNotes(updated.getNotes());

                    try {
                        appointmentRepository.save(existing);
                        handleAvailabilitySwitch(previousAvailabilityId, newAvailabilityId);
                        log.info("[AppointmentService] update - appointment {} updated", id);
                        return result.success("Appuntamento aggiornato con successo");
                    } catch (RuntimeException ex) {
                        log.error("[AppointmentService] update - error while saving appointment id={}", id, ex);
                        throw new InternalServerException("Errore interno durante l'aggiornamento dell'appuntamento", ex);
                    }
                })
                .orElseGet(() -> result.failure("Appuntamento non trovato"));
    }

    /**
     * Esegue un soft-delete dell'appuntamento e rilascia lo slot di disponibilità associato.
     * Non è possibile cancellare appuntamenti già completati.
     *
     * @param id identificativo dell'appuntamento da cancellare
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult delete(Long id) {
        SimpleResult result = new SimpleResult();

        log.info("[AppointmentService] delete - id={}", id);

        if (id == null) {
            return result.failure("L'id dell'appuntamento è obbligatorio");
        }

            return appointmentRepository.findById(id)
                    .map(existing -> {
                        if (isAppointmentCompleted(existing)) {
                            return result.failure(APPOINTMENT_ALREADY_COMPLETED_MESSAGE);
                        }

                        Long availabilityId = existing.getAvailabilityId();

                        try {
                            // soft-delete the appointment
                            existing.setActive(false);

                            // release slot if any and unlink availability to avoid FK issues
                            if (availabilityId != null) {
                                try {
                                    availabilityBookingPort.releaseSlot(availabilityId);
                                } catch (RuntimeException ex) {
                                    log.warn("[AppointmentService] releaseSlot failed for availabilityId={}", availabilityId, ex);
                                }
                                existing.setAvailabilityId(null);
                            }

                            appointmentRepository.save(existing);
                            return result.success("Appuntamento cancellato con successo");
                        } catch (RuntimeException ex) {
                            log.error("[AppointmentService] delete - error deleting appointment id={}", id, ex);
                            throw new InternalServerException("Errore interno durante la cancellazione dell'appuntamento", ex);
                        }
                    })
                    .orElseGet(() -> result.failure("Appuntamento non trovato"));
    }

    /**
     * Applica un filtro dinamico sugli appuntamenti attivi.
     * Se {@code filter} è {@code null}, restituisce una lista vuota.
     *
     * @param filter oggetto con i criteri di ricerca (patientId, doctorId, visitType, date range, status)
     * @return lista degli appuntamenti che soddisfano i criteri
     */
    public List<Appointment> filter(AppointmentFilter filter) {
        log.info("[AppointmentService] filter - applying filters");

        if (filter == null) {
            log.warn("[AppointmentService] filter - empty filter received");
            return List.of();
        }

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Appointment> cq = cb.createQuery(Appointment.class);
        Root<Appointment> root = cq.from(Appointment.class);

        List<Predicate> predicates = new ArrayList<>();
        if (filter.getPatientId() != null) {
            predicates.add(cb.equal(root.get("patientId"), filter.getPatientId()));
        }
        if (filter.getDoctorId() != null) {
            predicates.add(cb.equal(root.get("doctorId"), filter.getDoctorId()));
        }
        if (filter.getVisitType() != null) {
            predicates.add(cb.equal(root.get("visitType"), filter.getVisitType()));
        }
        if (filter.getFromDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("appointmentDay"), filter.getFromDate()));
        }
        if (filter.getToDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("appointmentDay"), filter.getToDate()));
        }
        if (filter.getStatus() != null) {
            predicates.add(cb.equal(root.get("status"), filter.getStatus()));
        }

        // show only active appointments by default
        predicates.add(cb.equal(root.get("active"), true));

        cq.where(cb.and(predicates.toArray(new Predicate[0])));
        TypedQuery<Appointment> query = entityManager.createQuery(cq);
        return query.getResultList();
    }

    private Optional<SimpleResult> validateAppointmentPayload(Appointment appointment,
                                                              boolean requireIdNull,
                                                              SimpleResult result) {
        if (appointment == null) {
            return Optional.of(result.failure("L'appuntamento non può essere null"));
        }

        if (requireIdNull && appointment.getId() != null) {
            return Optional.of(result.failure("Un nuovo appuntamento non deve avere un id"));
        }

        if (appointment.getPatientId() == null || appointment.getDoctorId() == null
                || appointment.getVisitType() == null || appointment.getAppointmentDay() == null || appointment.getAppointmentTime() == null
                || appointment.getStatus() == null) {
            return Optional.of(result.failure("patientId, doctorId, visitTypeId, appointmentDay/appointmentTime e status sono obbligatori"));
        }

        // Controllo conflitto: lo stesso paziente non può avere due appuntamenti
        // per la stessa data e lo stesso orario (diverso dall'appuntamento corrente se in update).
        Optional<Appointment> existingOpt = appointmentRepository.findByPatientIdAndAppointmentDayAndAppointmentTimeAndActiveTrue(
                appointment.getPatientId(),
                appointment.getAppointmentDay(),
                appointment.getAppointmentTime()
        );
        if (existingOpt.isPresent()) {
            Appointment existing = existingOpt.get();
            if (requireIdNull) {
                return Optional.of(result.failure("Il paziente ha già un appuntamento per quella data e orario"));
            } else {
                if (appointment.getId() == null || !existing.getId().equals(appointment.getId())) {
                    return Optional.of(result.failure("Il paziente ha già un appuntamento per quella data e orario"));
                }
            }
        }

        return Optional.empty();
    }

    private SimpleResult reserveSlotOrFailure(Long availabilityId, SimpleResult result) {
        if (availabilityId == null) {
            return null;
        }

        AvailabilityBookingResult bookingResult = availabilityBookingPort.reserveSlot(availabilityId);
        if (bookingResult.success()) {
            return null;
        }

        return result.failure(bookingResult.message());
    }

    private void handleAvailabilitySwitch(Long previousAvailabilityId, Long newAvailabilityId) {
        if (!Objects.equals(previousAvailabilityId, newAvailabilityId) && previousAvailabilityId != null) {
            releaseSlotSilently(previousAvailabilityId);
        }
    }

    private void releaseSlotSilently(Long availabilityId) {
        if (availabilityId == null) {
            return;
        }
        availabilityBookingPort.releaseSlot(availabilityId);
    }

    private boolean isAppointmentCompleted(Appointment appointment) {
        return appointment != null && AppointmentStatus.EFFETTUATA.equals(appointment.getStatus());
    }
}
