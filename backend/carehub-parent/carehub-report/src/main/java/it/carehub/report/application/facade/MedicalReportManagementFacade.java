package it.carehub.report.application.facade;

import it.carehub.common.report.port.MedicalReportManagementPort;
import it.carehub.report.domain.repository.MedicalReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class MedicalReportManagementFacade implements MedicalReportManagementPort {

    private final MedicalReportRepository medicalReportRepository;

    @Override
    public void deleteByDoctorId(Long doctorId) {
        log.info("[MedicalReportManagementFacade] deleteByDoctorId - id={}", doctorId);
        if (doctorId != null) {
            medicalReportRepository.deleteByDoctorId(doctorId);
        }
    }

    @Override
    public void deleteByPatientId(Long patientId) {
        log.info("[MedicalReportManagementFacade] deleteByPatientId - id={}", patientId);
        if (patientId != null) {
            medicalReportRepository.deleteByPatientId(patientId);
        }
    }
}
