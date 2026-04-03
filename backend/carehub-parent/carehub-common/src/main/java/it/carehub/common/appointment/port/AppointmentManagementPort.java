package it.carehub.common.appointment.port;

public interface AppointmentManagementPort {
    void deleteByDoctorId(Long doctorId);
    void deleteByPatientId(Long patientId);
    void markAsDone(Long appointmentId);
    void deletePermanentlyByDoctorId(Long doctorId);
    void deletePermanentlyByPatientId(Long patientId);
    void reactivateByDoctorId(Long doctorId);
    void reactivateByPatientId(Long patientId);
    /**
     * Returns true if there exists any appointment referencing the given availability id
     */
    boolean existsByAvailabilityId(Long availabilityId);
}
