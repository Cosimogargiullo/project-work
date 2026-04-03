package it.carehub.common.availability.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotsDto {
    private Long id;
    private String time;
    private Boolean selected;
    private Boolean booked;
}
