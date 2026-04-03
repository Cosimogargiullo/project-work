package it.carehub.common.availability.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO per la creazione e aggiornamento degli slot di disponibilità.
 * Utilizzato per creare nuovi slot o aggiornare quelli esistenti.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAvailableSlotsRequest {
    /** ID del medico */
    private Long doctorId;

    /** Data della disponibilità nel formato MM-dd-yyyy */
    private LocalDate availableDay;

    /** Durata degli slot in minuti (supportato solo 60) */
    private Integer durationMinutes;

    /** Lista degli slot orari nel formato HH:mm (es. "09:00", "10:00") */
    private List<SlotsDto> slots;
}
