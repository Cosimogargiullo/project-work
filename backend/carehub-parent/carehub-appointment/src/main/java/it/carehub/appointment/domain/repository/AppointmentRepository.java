package it.carehub.appointment.domain.repository;

import it.carehub.appointment.domain.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
	Optional<Appointment> findByPatientIdAndAppointmentDayAndAppointmentTime(Long patientId, LocalDate appointmentDay, LocalTime appointmentTime);

	boolean existsByAvailabilityId(Long availabilityId);

	// Active-aware queries
	Optional<Appointment> findByPatientIdAndAppointmentDayAndAppointmentTimeAndActiveTrue(Long patientId, LocalDate appointmentDay, LocalTime appointmentTime);

	java.util.List<Appointment> findAllByActiveTrue();
	Optional<Appointment> findByIdAndActiveTrue(Long id);

	void deleteByDoctorId(Long doctorId);
	void deleteByPatientId(Long patientId);
	java.util.List<Appointment> findAllByPatientId(Long patientId);
	java.util.List<Appointment> findAllByDoctorId(Long doctorId);

	java.util.List<Appointment> findAllByPatientIdAndActiveTrue(Long patientId);
	java.util.List<Appointment> findAllByDoctorIdAndActiveTrue(Long doctorId);
}
