package it.carehub.common.report.port;

public interface MedicalReportManagementPort {
    void deleteByDoctorId(Long doctorId);
    void deleteByPatientId(Long patientId);
}
