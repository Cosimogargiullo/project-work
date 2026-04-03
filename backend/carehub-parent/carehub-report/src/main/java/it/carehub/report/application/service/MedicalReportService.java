package it.carehub.report.application.service;

import it.carehub.common.report.dto.MedicalReportFilter;
import it.carehub.common.report.dto.AnalyticsOverviewDto;
import it.carehub.common.report.dto.DoctorRevenueDto;
import it.carehub.common.report.dto.MonthlyRevenueDto;
import it.carehub.common.exception.InternalServerException;
import it.carehub.common.utils.SimpleResult;
import it.carehub.report.domain.model.MedicalReport;
import it.carehub.report.domain.repository.MedicalReportRepository;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MedicalReportService {

    private final MedicalReportRepository medicalReportRepository;
    private final it.carehub.common.appointment.port.AppointmentManagementPort appointmentManagementPort;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Restituisce tutti i referti medici presenti nel sistema.
     *
     * @return lista di tutti i {@link MedicalReport}
     */
    public List<MedicalReport> findAll() {
        return medicalReportRepository.findAll();
    }

    /**
     * Recupera un referto medico per identificativo.
     *
     * @param id identificativo del referto
     * @return {@link Optional} contenente il referto se trovato, vuoto se {@code id == null} o non esistente
     */
    public Optional<MedicalReport> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return medicalReportRepository.findById(id);
    }

    /**
     * Crea un nuovo referto medico con allegato PDF e marca l'appuntamento come effettuato.
     *
     * @param patientId     identificativo del paziente
     * @param doctorId      identificativo del medico
     * @param appointmentId identificativo dell'appuntamento
     * @param summary       riepilogo testuale del referto (opzionale)
     * @param notes         note aggiuntive (opzionale)
     * @param cost          costo della visita
     * @param file          file PDF del referto
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore nella lettura del file o nel salvataggio
     */
    @Transactional
    public SimpleResult create(Long patientId,
                               Long doctorId,
                               Long appointmentId,
                               String summary,
                               String notes,
                               BigDecimal cost,
                               MultipartFile file) {
        SimpleResult result = new SimpleResult();

        log.info("[MedicalReportService] create - patientId={} doctorId={} appointmentId={}", patientId, doctorId, appointmentId);

        if (patientId == null || doctorId == null || appointmentId == null || cost == null) {
            return result.failure("patientId, doctorId, appointmentId e cost sono obbligatori");
        }

        if (file == null || file.isEmpty()) {
            return result.failure("Il file PDF del referto e obbligatorio");
        }

        if (cost.compareTo(BigDecimal.ZERO) < 0) {
            return result.failure("Il costo non puo essere negativo");
        }

        if (medicalReportRepository.findByAppointmentId(appointmentId).isPresent()) {
            return result.failure("Esiste gia un referto per questo appuntamento");
        }

        try {
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.pdf";
            String contentType = file.getContentType() != null ? file.getContentType() : "application/pdf";
            byte[] content = file.getBytes();
            LocalDateTime now = LocalDateTime.now();

            MedicalReport entity = MedicalReport.builder()
                    .patientId(patientId)
                    .doctorId(doctorId)
                    .appointmentId(appointmentId)
                    .summary(summary)
                    .notes(notes)
                    .cost(cost)
                    .fileName(fileName)
                    .contentType(contentType)
                    .pdfContent(content)
                    .reportDate(now)
                    .createdAt(now)
                    .build();

            medicalReportRepository.save(Objects.requireNonNull(entity, "Medical report cannot be null"));
            log.info("[MedicalReportService] create - report {} created for appointment {}", entity.getId(), appointmentId);

            // Mark the appointment as EFFETTUATA via port (keeps modules decoupled)
            try {
                appointmentManagementPort.markAsDone(appointmentId);
            } catch (Exception ex) {
                log.error("[MedicalReportService] create - failed to mark appointment {} as EFFETTUATA", appointmentId, ex);
                throw new InternalServerException("Referto salvato ma errore nell'aggiornamento dello stato dell'appuntamento", ex);
            }

            return result.success("Referto creato con successo");
        } catch (IOException ex) {
            log.error("[MedicalReportService] create - error reading file", ex);
            throw new InternalServerException("Errore nella lettura del file del referto", ex);
        } catch (Exception ex) {
            log.error("[MedicalReportService] create - unexpected error", ex);
            throw new InternalServerException("Errore interno durante la creazione del referto", ex);
        }
    }

    /**
     * Elimina un referto medico in modo definitivo.
     *
     * @param id identificativo del referto da eliminare
     * @return {@link SimpleResult} con esito dell'operazione
     */
    @Transactional
    public SimpleResult delete(Long id) {
        SimpleResult result = new SimpleResult();
        log.info("[MedicalReportService] delete - id={}", id);

        if (id == null) {
            return result.failure("L'id del referto e obbligatorio");
        }

        return medicalReportRepository.findById(id)
                .map(existing -> {
                    medicalReportRepository.delete(Objects.requireNonNull(existing, "Medical report cannot be null"));
                    return result.success("Referto eliminato con successo");
                })
                .orElseGet(() -> result.failure("Referto non trovato"));
    }

    /**
     * Aggiorna un referto medico esistente, opzionalmente sostituendo il file PDF allegato.
     *
     * @param id            identificativo del referto da aggiornare
     * @param patientId     identificativo del paziente
     * @param doctorId      identificativo del medico
     * @param appointmentId identificativo dell'appuntamento
     * @param summary       riepilogo testuale (opzionale)
     * @param notes         note aggiuntive (opzionale)
     * @param cost          costo della visita
     * @param file          nuovo file PDF da allegare (opzionale; se null conserva quello attuale)
     * @return {@link SimpleResult} con esito dell'operazione
     * @throws InternalServerException in caso di errore nella lettura del file
     */
    @Transactional
    public SimpleResult update(Long id,
                               Long patientId,
                               Long doctorId,
                               Long appointmentId,
                               String summary,
                               String notes,
                               BigDecimal cost,
                               MultipartFile file) {
        SimpleResult result = new SimpleResult();
        log.info("[MedicalReportService] update - id={} patientId={} doctorId={} appointmentId={}", id, patientId, doctorId, appointmentId);

        if (id == null || patientId == null || doctorId == null || appointmentId == null || cost == null) {
            return result.failure("id, patientId, doctorId, appointmentId e cost sono obbligatori");
        }

        if (cost.compareTo(BigDecimal.ZERO) < 0) {
            return result.failure("Il costo non puo essere negativo");
        }

        Optional<MedicalReport> byAppointment = medicalReportRepository.findByAppointmentId(appointmentId);
        if (byAppointment.isPresent() && !byAppointment.get().getId().equals(id)) {
            return result.failure("Esiste gia un referto per questo appuntamento");
        }

        return medicalReportRepository.findById(id)
                .map(existing -> {
                    existing.setPatientId(patientId);
                    existing.setDoctorId(doctorId);
                    existing.setAppointmentId(appointmentId);
                    existing.setSummary(summary);
                    existing.setNotes(notes);
                    existing.setCost(cost);

                    if (file != null && !file.isEmpty()) {
                        try {
                            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : existing.getFileName();
                            String contentType = file.getContentType() != null ? file.getContentType() : "application/pdf";
                            existing.setFileName(fileName);
                            existing.setContentType(contentType);
                            existing.setPdfContent(file.getBytes());
                        } catch (IOException ex) {
                            log.error("[MedicalReportService] update - error reading file", ex);
                            throw new InternalServerException("Errore nella lettura del file del referto", ex);
                        }
                    }

                    medicalReportRepository.save(existing);
                    return result.success("Referto aggiornato con successo");
                })
                .orElseGet(() -> result.failure("Referto non trovato"));
    }

    /**
     * Applica un filtro dinamico sui referti medici.
     * Se {@code filter} è {@code null}, restituisce una lista vuota.
     *
     * @param filter criteri di ricerca (patientId, doctorId, appointmentId, date range)
     * @return lista dei referti che soddisfano i criteri
     */
    public List<MedicalReport> filter(MedicalReportFilter filter) {
        log.info("[MedicalReportService] filter - filter={}", filter);

        if (filter == null) {
            return Collections.emptyList();
        }

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<MedicalReport> cq = cb.createQuery(MedicalReport.class);
        Root<MedicalReport> root = cq.from(MedicalReport.class);

        List<Predicate> predicates = new ArrayList<>();
        if (filter.getPatientId() != null) {
            predicates.add(cb.equal(root.get("patientId"), filter.getPatientId()));
        }
        if (filter.getDoctorId() != null) {
            predicates.add(cb.equal(root.get("doctorId"), filter.getDoctorId()));
        }
        if (filter.getAppointmentId() != null) {
            predicates.add(cb.equal(root.get("appointmentId"), filter.getAppointmentId()));
        }
        if (filter.getFromDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("reportDate"), filter.getFromDate()));
        }
        if (filter.getToDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("reportDate"), filter.getToDate()));
        }

        cq.where(cb.and(predicates.toArray(new Predicate[0])));
        TypedQuery<MedicalReport> query = entityManager.createQuery(cq);
        return query.getResultList();
    }

    /**
     * Restituisce tutti i referti di un paziente.
     *
     * @param id identificativo del paziente
     * @return lista dei referti del paziente; vuota se {@code id == null}
     */
    public List<MedicalReport> findByPatientId(Long id) {
        log.info("[MedicalReportService] findByPatientId - id={}", id);
        if (id == null) {
            return Collections.emptyList();
        }
        return medicalReportRepository.findByPatientId(id);
    }

    /**
     * Restituisce tutti i referti di un medico.
     *
     * @param id identificativo del medico
     * @return lista dei referti del medico; vuota se {@code id == null}
     */
    public List<MedicalReport> findByDoctorId(Long id) {
        log.info("[MedicalReportService] findByDoctorId - id={}", id);
        if (id == null) {
            return Collections.emptyList();
        }
        return medicalReportRepository.findByDoctorId(id);
    }

    /**
     * Recupera il referto associato a un appuntamento.
     *
     * @param id identificativo dell'appuntamento
     * @return {@link Optional} contenente il referto se trovato, vuoto se {@code id == null} o non esistente
     */
    public Optional<MedicalReport> findByAppointmentId(Long id) {
        log.info("[MedicalReportService] findByAppointmentId - id={}", id);
        if (id == null) {
            return Optional.empty();
        }
        return medicalReportRepository.findByAppointmentId(id);
    }

    /**
     * Calcola una panoramica analitica aggregata (totale ricavi, numero referti, costo medio).
     * I parametri di filtro sono tutti opzionali.
     *
     * @param from      data/ora di inizio intervallo (inclusa)
     * @param to        data/ora di fine intervallo (inclusa)
     * @param doctorId  identificativo del medico (se {@code null} include tutti)
     * @param patientId identificativo del paziente (se {@code null} include tutti)
     * @return {@link AnalyticsOverviewDto} con totale, conteggio e media
     */
    public AnalyticsOverviewDto getOverview(LocalDateTime from, LocalDateTime to, Long doctorId, Long patientId) {
        StringBuilder sql = new StringBuilder("SELECT COALESCE(SUM(cost),0), COUNT(*), COALESCE(AVG(cost),0) FROM carehub.medical_report WHERE 1=1");
        if (from != null) {
            sql.append(" AND report_date >= :from");
        }
        if (to != null) {
            sql.append(" AND report_date <= :to");
        }
        if (doctorId != null) {
            sql.append(" AND doctor_id = :doctorId");
        }
        if (patientId != null) {
            sql.append(" AND patient_id = :patientId");
        }

        var query = entityManager.createNativeQuery(sql.toString());
        if (from != null) {
            query.setParameter("from", java.sql.Timestamp.valueOf(from));
        }
        if (to != null) {
            query.setParameter("to", java.sql.Timestamp.valueOf(to));
        }
        if (doctorId != null) {
            query.setParameter("doctorId", doctorId);
        }
        if (patientId != null) {
            query.setParameter("patientId", patientId);
        }

        Object[] row = (Object[]) query.getSingleResult();
        BigDecimal total = row[0] != null ? (BigDecimal) row[0] : BigDecimal.ZERO;
        Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
        BigDecimal avg = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
        return new AnalyticsOverviewDto(total, count, avg);
    }

    /**
     * Calcola i ricavi mensili aggregati per il periodo e i filtri specificati.
     *
     * @param from      data/ora di inizio intervallo (opzionale)
     * @param to        data/ora di fine intervallo (opzionale)
     * @param doctorId  identificativo del medico (opzionale)
     * @param patientId identificativo del paziente (opzionale)
     * @return lista di {@link MonthlyRevenueDto} ordinata per mese crescente
     */
    public List<MonthlyRevenueDto> getMonthlyRevenue(LocalDateTime from, LocalDateTime to, Long doctorId, Long patientId) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT to_char(date_trunc('month', report_date), 'YYYY-MM') AS month, COALESCE(SUM(cost),0) AS total, COUNT(*) AS cnt");
        sql.append(" FROM carehub.medical_report WHERE 1=1");
        if (from != null) {
            sql.append(" AND report_date >= :from");
        }
        if (to != null) {
            sql.append(" AND report_date <= :to");
        }
        if (doctorId != null) {
            sql.append(" AND doctor_id = :doctorId");
        }
        if (patientId != null) {
            sql.append(" AND patient_id = :patientId");
        }
        sql.append(" GROUP BY month ORDER BY month");

        var query = entityManager.createNativeQuery(sql.toString());
        if (from != null) {
            query.setParameter("from", java.sql.Timestamp.valueOf(from));
        }
        if (to != null) {
            query.setParameter("to", java.sql.Timestamp.valueOf(to));
        }
        if (doctorId != null) {
            query.setParameter("doctorId", doctorId);
        }
        if (patientId != null) {
            query.setParameter("patientId", patientId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        if (rows == null) {
            return Collections.emptyList();
        }

        return rows.stream().map(r -> {
            String month = r[0] != null ? String.valueOf(r[0]) : null;
            BigDecimal total = r[1] != null ? (BigDecimal) r[1] : BigDecimal.ZERO;
            Long cnt = r[2] != null ? ((Number) r[2]).longValue() : 0L;
            return new MonthlyRevenueDto(month, total, cnt);
        }).collect(Collectors.toList());
    }

    /**
     * Calcola i ricavi aggregati per medico (top-N), filtrati per periodo e/o paziente.
     *
     * @param from      data/ora di inizio intervallo (opzionale)
     * @param to        data/ora di fine intervallo (opzionale)
     * @param patientId identificativo del paziente (opzionale)
     * @param limit     numero massimo di medici da restituire (0 = nessun limite)
     * @return lista di {@link DoctorRevenueDto} ordinata per ricavo decrescente
     */
    public List<DoctorRevenueDto> getRevenueByDoctor(LocalDateTime from, LocalDateTime to, Long patientId, int limit) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT doctor_id, COALESCE(SUM(cost),0) AS total, COUNT(*) AS cnt");
        sql.append(" FROM carehub.medical_report WHERE 1=1");
        if (from != null) {
            sql.append(" AND report_date >= :from");
        }
        if (to != null) {
            sql.append(" AND report_date <= :to");
        }
        if (patientId != null) {
            sql.append(" AND patient_id = :patientId");
        }
        sql.append(" GROUP BY doctor_id ORDER BY total DESC");
        if (limit > 0) {
            sql.append(" LIMIT ").append(limit);
        }

        var query = entityManager.createNativeQuery(sql.toString());
        if (from != null) {
            query.setParameter("from", java.sql.Timestamp.valueOf(from));
        }
        if (to != null) {
            query.setParameter("to", java.sql.Timestamp.valueOf(to));
        }
        if (patientId != null) {
            query.setParameter("patientId", patientId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        if (rows == null) {
            return Collections.emptyList();
        }

        return rows.stream().map(r -> {
            Long docId = r[0] != null ? ((Number) r[0]).longValue() : null;
            BigDecimal total = r[1] != null ? (BigDecimal) r[1] : BigDecimal.ZERO;
            Long cnt = r[2] != null ? ((Number) r[2]).longValue() : 0L;
            return new DoctorRevenueDto(docId, total, cnt);
        }).collect(Collectors.toList());
    }
}
