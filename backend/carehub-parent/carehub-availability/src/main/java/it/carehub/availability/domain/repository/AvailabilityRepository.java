package it.carehub.availability.domain.repository;

import it.carehub.availability.domain.model.AvailableDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AvailabilityRepository extends JpaRepository<AvailableDate, Long> {
    List<AvailableDate> findAllByOrderByAvailableDayAscAvailableTimeAsc();
    List<AvailableDate> findAllByIsActiveTrueOrderByAvailableDayAscAvailableTimeAsc();
    List<AvailableDate> findByDoctorIdOrderByAvailableDayAscAvailableTimeAsc(Long doctorId);
    List<AvailableDate> findByDoctorIdAndIsBookedFalseOrderByAvailableDayAscAvailableTimeAsc(Long doctorId);
    List<AvailableDate> findByDoctorIdAndIsActiveTrueOrderByAvailableDayAscAvailableTimeAsc(Long doctorId);
    boolean existsByDoctorIdAndAvailableDayAndAvailableTime(Long doctorId, LocalDate availableDay, LocalTime availableTime);

    @Modifying
    @Query("DELETE FROM AvailableDate ad WHERE ad.doctorId = :doctorId AND ad.availableDay = :day AND ad.isBooked = false")
    int deleteActiveByDoctorIdAndAvailableDay(@Param("doctorId") Long doctorId,
                                              @Param("day") LocalDate day);

    @Modifying
    @Query("DELETE FROM AvailableDate ad WHERE ad.doctorId = :doctorId AND ad.isBooked = false")
    int deleteActiveByDoctorId(@Param("doctorId") Long doctorId);

    List<AvailableDate> findByDoctorIdAndAvailableDayOrderByAvailableTimeAsc(Long doctorId, LocalDate availableDay);
    List<AvailableDate> findByDoctorIdAndAvailableDayAndIsBookedFalseOrderByAvailableTimeAsc(Long doctorId, LocalDate availableDay);
    List<AvailableDate> findByDoctorIdAndAvailableDayAndIsActiveTrueOrderByAvailableTimeAsc(Long doctorId, LocalDate availableDay);
    List<AvailableDate> findByDoctorIdAndAvailableDayAndIsActiveTrueAndIsBookedFalseOrderByAvailableTimeAsc(Long doctorId, LocalDate availableDay);

    void deleteByDoctorId(Long doctorId);

    /**
     * Restituisce tutti i valori dell'enum PostgreSQL availability_duration
     * (es. MIN_15, MIN_30, MIN_45, MIN_60).
     */
    @Query(value = "SELECT unnest(enum_range(NULL::carehub.availability_duration))", nativeQuery = true)
    List<String> findAllAvailabilityDurations();
}
