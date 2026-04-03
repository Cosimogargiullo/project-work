package it.carehub.availability.application.service;

import it.carehub.availability.domain.model.AvailableDate;
import it.carehub.availability.domain.model.AvailabilityDuration;
import it.carehub.availability.domain.repository.AvailabilityRepository;
import it.carehub.common.availability.dto.CreateAvailableSlotsRequest;
import it.carehub.common.availability.dto.SlotsDto;
import it.carehub.common.exception.InternalServerException;
import it.carehub.common.utils.SimpleResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import it.carehub.common.user.port.UserLookupPort;
import it.carehub.common.appointment.port.AppointmentManagementPort;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AvailabilityService {
    private final AvailabilityRepository availabilityRepository;
    private final UserLookupPort userLookupPort;
    private final AppointmentManagementPort appointmentManagementPort;

    /**
     * Restituisce tutti gli slot di disponibilità presenti nel sistema.
     *
     * @return lista di tutti gli slot disponibili
     */
    public List<AvailableDate> getAll() {
        log.info("[AvailabilityService] getAll - retrieving all slots");
        return getAll(null);
    }

    /**
     * Restituisce tutti gli slot filtrati per stato di attivazione.
     *
     * @param isActive se {@code true} restituisce solo gli slot attivi; se {@code null} restituisce tutti
     * @return lista degli slot corrispondenti al filtro
     */
    public List<AvailableDate> getAll(Boolean isActive) {
        log.info("[AvailabilityService] getAll - retrieving all slots (isActive={})", isActive);
        if (Boolean.TRUE.equals(isActive)) {
            return availabilityRepository.findAllByIsActiveTrueOrderByAvailableDayAscAvailableTimeAsc();
        }
        return availabilityRepository.findAllByOrderByAvailableDayAscAvailableTimeAsc();
    }

    /**
     * Restituisce tutti gli slot di disponibilità di un medico.
     *
     * @param doctorId identificativo del medico
     * @return lista degli slot del medico
     */
    public List<AvailableDate> getByDoctor(Long doctorId) {
        log.info("[AvailabilityService] getByDoctor - doctorId={}", doctorId);
        return getByDoctor(doctorId, null);
    }

    /**
     * Restituisce gli slot di disponibilità di un medico filtrati per stato di attivazione.
     *
     * @param doctorId identificativo del medico
     * @param isActive se {@code true} restituisce solo gli slot attivi; se {@code null} restituisce tutti
     * @return lista degli slot del medico corrispondenti al filtro
     */
    public List<AvailableDate> getByDoctor(Long doctorId, Boolean isActive) {
        log.info("[AvailabilityService] getByDoctor - doctorId={} isActive={}", doctorId, isActive);
        if (Boolean.TRUE.equals(isActive)) {
            return availabilityRepository.findByDoctorIdAndIsActiveTrueOrderByAvailableDayAscAvailableTimeAsc(doctorId);
        }
        return availabilityRepository.findByDoctorIdOrderByAvailableDayAscAvailableTimeAsc(doctorId);
    }

    /**
     * Restituisce gli slot di disponibilità di un medico per una data specifica.
     *
     * @param doctorId  identificativo del medico
     * @param date      data per cui cercare gli slot
     * @param isActive  se {@code true} filtra per slot attivi
     * @param notBooked se {@code true} filtra per slot non ancora prenotati
     * @return oggetto {@link CreateAvailableSlotsRequest} con la lista di slot corrispondenti
     */
    public CreateAvailableSlotsRequest getSlotsByDoctorAndDate(Long doctorId, LocalDate date, Boolean isActive, Boolean notBooked) {
        log.info("[AvailabilityService] getSlotsByDoctorAndDate - doctorId={} date={} isActive={} notBooked={}", doctorId, date, isActive, notBooked);

        if (doctorId == null || date == null) {
            return new CreateAvailableSlotsRequest();
        }

        List<AvailableDate> raw;
        if (Boolean.TRUE.equals(isActive) && Boolean.TRUE.equals(notBooked)) {
            raw = availabilityRepository.findByDoctorIdAndAvailableDayAndIsActiveTrueAndIsBookedFalseOrderByAvailableTimeAsc(doctorId, date);
        } else if (Boolean.TRUE.equals(isActive)) {
            raw = availabilityRepository.findByDoctorIdAndAvailableDayAndIsActiveTrueOrderByAvailableTimeAsc(doctorId, date);
        } else if (Boolean.TRUE.equals(notBooked)) {
            raw = availabilityRepository.findByDoctorIdAndAvailableDayAndIsBookedFalseOrderByAvailableTimeAsc(doctorId, date);
        } else {
            raw = availabilityRepository.findByDoctorIdAndAvailableDayOrderByAvailableTimeAsc(doctorId, date);
        }

        List<SlotsDto> slots = raw.stream()
            .map(slot -> new SlotsDto(slot.getId(), slot.getAvailableTime().toString(), slot.isActive(), slot.isBooked()))
            .toList();

        return new CreateAvailableSlotsRequest(doctorId, date, 60, slots);
    }

    /**
     * Elimina tutti gli slot di disponibilità attivi di un medico per una data specifica.
     *
     * @param doctorId identificativo del medico
     * @param date     data per cui eliminare gli slot
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante l'eliminazione
     */
    @Transactional
    public SimpleResult deleteByDoctorAndDate(Long doctorId, LocalDate date) {
        SimpleResult result = new SimpleResult();
        log.info("[AvailabilityService] deleteByDoctorAndDate - doctorId={} date={}", doctorId, date);

        if (doctorId == null || date == null) {
            return result.failure("doctorId e date sono obbligatori");
        }

        try {
            long deleted = availabilityRepository.deleteActiveByDoctorIdAndAvailableDay(doctorId, date);

            String message = deleted == 0
                    ? "Nessuno slot di disponibilità trovato per la data indicata"
                    : "Eliminati " + deleted + " slot di disponibilità";

            return result.success(message);
        } catch (Exception ex) {
            log.error("[AvailabilityService] deleteByDoctorAndDate - internal error doctorId={} date={}", doctorId, date, ex);
            throw new InternalServerException("Errore interno durante l'eliminazione delle disponibilità", ex);
        }
    }

    /**
     * Crea nuovi slot di disponibilità per un medico in una data specifica.
     * Non sovrascrive slot già esistenti; ignora duplicati.
     *
     * @param request oggetto con doctorId, data e lista di slot da creare
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult create(CreateAvailableSlotsRequest request) {
        log.info("[AvailabilityService] create - doctor={} date={}",
                request != null ? request.getDoctorId() : null,
                request != null ? request.getAvailableDay() : null);

        return persistSlots(request, false);
    }

    /**
     * Aggiorna gli slot di disponibilità per un medico in una data specifica.
     * Gli slot non prenotati vengono sostituiti; quelli già prenotati vengono conservati.
     *
     * @param request oggetto con doctorId, data e nuovi slot da persistere
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore tecnico durante il salvataggio
     */
    @Transactional
    public SimpleResult update(CreateAvailableSlotsRequest request) {
        log.info("[AvailabilityService] update - doctor={} date={}",
                request != null ? request.getDoctorId() : null,
                request != null ? request.getAvailableDay() : null);

        return persistSlots(request, true);
    }

    /**
     * Restituisce tutti i valori dell'enum {@code availability_duration} supportati dal sistema.
     *
     * @return lista delle durate disponibili come stringhe
     */
    public List<String> getDurations() {
        log.info("[AvailabilityService] getDurations");
        return availabilityRepository.findAllAvailabilityDurations();
    }

    /**
     * Recupera uno slot di disponibilità per identificativo.
     *
     * @param id identificativo dello slot
     * @return {@link Optional} contenente lo slot se trovato, vuoto altrimenti
     */
    public Optional<AvailableDate> getById(Long id) {
        log.info("[AvailabilityService] getById - id={}", id);
        if (id == null) {
            return Optional.empty();
        }
        return availabilityRepository.findById(id);
    }

    private SimpleResult persistSlots(CreateAvailableSlotsRequest request, boolean replaceExisting) {
        SimpleResult result = new SimpleResult();

        Optional<SimpleResult> validation = validateSlotsRequest(request, result, replaceExisting);
        if (validation.isPresent()) {
            return validation.get();
        }

        // Check if the doctor is active; if not, refuse creation/update with a friendly message
        Long doctorId = request.getDoctorId();
        if (doctorId == null || Boolean.FALSE.equals(userLookupPort.isActive(doctorId))) {
            return result.failure("Il medico è disattivato. Riattivalo prima di creare o modificare le disponibilità.");
        }

        LocalDate baseDate = request.getAvailableDay();
        AvailabilityDuration durationEnum = AvailabilityDuration.MIN_60;
        List<SlotsDto> slots = request.getSlots();

        try {
            if (replaceExisting) {
                List<AvailableDate> existingSlots = availabilityRepository.findByDoctorIdAndAvailableDayOrderByAvailableTimeAsc(doctorId, baseDate);

                List<AvailableDate> toDelete = existingSlots.stream()
                        .filter(s -> !s.isBooked())
                        .toList();

                long keptBooked = existingSlots.stream().filter(AvailableDate::isBooked).count();

                if (!toDelete.isEmpty()) {
                    // Filter out any availability that is still referenced by an appointment
                    java.util.List<AvailableDate> removable = new java.util.ArrayList<>();
                    for (AvailableDate ad : toDelete) {
                        Long aid = ad.getId();
                        boolean referenced = false;
                        try {
                            referenced = appointmentManagementPort.existsByAvailabilityId(aid);
                        } catch (Exception ex) {
                            log.warn("[AvailabilityService] check existsByAvailabilityId failed for id={}", aid, ex);
                        }
                        if (!referenced) removable.add(ad);
                    }

                    if (!removable.isEmpty()) {
                        availabilityRepository.deleteAll(removable);
                        log.info("[AvailabilityService] persistSlots - removed {} free slots for doctor={} date={}", removable.size(), doctorId, baseDate);
                    } else {
                        log.info("[AvailabilityService] persistSlots - no free slots removable (referenced by appointments) for doctor={} date={}", doctorId, baseDate);
                    }
                }

                if (keptBooked > 0) {
                    log.info("[AvailabilityService] persistSlots - kept {} booked slots (not removed) doctor={} date={}", keptBooked, doctorId, baseDate);
                }
            }

            List<AvailableDate> created = saveSlots(doctorId, baseDate, durationEnum, slots);

            String message = buildSuccessMessage(created, replaceExisting, doctorId, baseDate);
            log.info("[AvailabilityService] persistSlots - success message: {} (replaceExisting={})", message, replaceExisting);

            return result.success(message);
        } catch (Exception ex) {
            log.error("[AvailabilityService] persistSlots - internal error doctorId={} date={} replaceExisting={}", doctorId, baseDate, replaceExisting, ex);
            String errorMessage = replaceExisting ? "Errore interno durante l'aggiornamento delle disponibilità" : "Errore interno durante la creazione delle disponibilità";
            throw new InternalServerException(errorMessage, ex);
        }
    }

    private Optional<SimpleResult> validateSlotsRequest(CreateAvailableSlotsRequest request, SimpleResult result, boolean replaceExisting) {
        if (request == null) {
            return Optional.of(result.failure("CreateAvailableSlotsRequest non può essere null"));
        }

        Long doctorId = request.getDoctorId();
        LocalDate availableDay = request.getAvailableDay();
        Integer durationMinutes = request.getDurationMinutes();
        List<SlotsDto> slots = request.getSlots();

        if (doctorId == null || availableDay == null || durationMinutes == null || slots == null || slots.isEmpty()) {
            return Optional.of(result.failure("Si prega di generare correttamente degli slot!"));
        }

        LocalDate today = LocalDate.now();
        if (availableDay.isBefore(today)) {
            String message = replaceExisting
                    ? "Non è possibile aggiornare disponibilità per una data precedente a oggi."
                    : "Non è possibile creare disponibilità per una data precedente a oggi.";
            return Optional.of(result.failure(message));
        }

        if (durationMinutes != 60) {
            return Optional.of(result.failure("Per ora è supportata solo la durata di 60 minuti."));
        }

        return Optional.empty();
    }

    private List<AvailableDate> saveSlots(Long doctorId, LocalDate baseDate, AvailabilityDuration duration, List<SlotsDto> slots) {
        List<AvailableDate> created = new ArrayList<>();
        Set<String> uniqueSlots = new LinkedHashSet<>();

        for (SlotsDto slotDto : slots) {
            if (slotDto == null || slotDto.getTime() == null || slotDto.getTime().isBlank()) {
                continue;
            }

            String slot = slotDto.getTime().trim();
            if (!uniqueSlots.add(slot)) {
                log.debug("[AvailabilityService] saveSlots - duplicate slot ignored: {}", slot);
                continue;
            }

            try {
                LocalTime time = LocalTime.parse(slot);

                if (availabilityRepository.existsByDoctorIdAndAvailableDayAndAvailableTime(doctorId, baseDate, time)) {
                    log.debug("[AvailabilityService] saveSlots - slot already exists: {}", slot);
                    continue;
                }

                AvailableDate entity = AvailableDate.builder()
                        .doctorId(doctorId)
                        .availableDay(baseDate)
                        .availableTime(time)
                        .durationMinutes(duration)
                        .isActive(Boolean.TRUE.equals(slotDto.getSelected()))
                        .build();

                created.add(availabilityRepository.save(Objects.requireNonNull(entity, "Availability entity cannot be null")));
            } catch (Exception e) {
                log.warn("[AvailabilityService] saveSlots - error parsing time slot '{}': {}", slot, e.getMessage());
            }
        }

        return created;
    }

    private String buildSuccessMessage(List<AvailableDate> created, boolean replaceExisting, Long doctorId, LocalDate baseDate) {
        String bookedNote = "";

        if (replaceExisting) {
            long bookedStillPresent = availabilityRepository
                    .findByDoctorIdAndAvailableDayOrderByAvailableTimeAsc(doctorId, baseDate)
                    .stream()
                    .filter(AvailableDate::isBooked)
                    .count();

            if (bookedStillPresent > 0) {
                bookedNote = " (" + bookedStillPresent + " slot prenotati mantenuti)";
            }
        }

        if (created.isEmpty()) {
            return replaceExisting
                    ? "Nessuno slot di disponibilità è stato creato" + bookedNote
                    : "Nessuno slot di disponibilità è stato creato (tutti duplicati o input vuoto)";
        }

        return replaceExisting
                ? "Aggiornati " + created.size() + " slot di disponibilità" + bookedNote
                : "Creati " + created.size() + " slot di disponibilità";
    }
}
