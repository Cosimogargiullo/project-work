package it.carehub.report.domain.repository;

import it.carehub.report.domain.model.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
	void deleteByDoctorId(Long doctorId);
	void deleteByPatientId(Long patientId);

	Optional<MedicalReport> findByAppointmentId(Long appointmentId);

	List<MedicalReport> findByPatientId(Long patientId);

	List<MedicalReport> findByDoctorId(Long doctorId);
}
