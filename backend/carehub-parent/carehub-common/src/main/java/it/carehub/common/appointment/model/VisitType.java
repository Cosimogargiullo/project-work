package it.carehub.common.appointment.model;

import it.carehub.common.user.model.Specialization;

public enum VisitType {
    VISITA_CARDIOLOGICA(Specialization.CARDIOLOGIA),
    VISITA_ORTOPEDICA(Specialization.ORTOPEDIA),
    VISITA_DERMATOLOGICA(Specialization.DERMATOLOGIA);

    private final Specialization specialization;

    VisitType(Specialization specialization) {
        this.specialization = specialization;
    }

    public Specialization getSpecialization() {
        return specialization;
    }

    public static VisitType fromSpecialization(String specialization) {
        try {
            Specialization spec = Specialization.valueOf(specialization.toUpperCase());
            for (VisitType vt : values()) {
                if (vt.getSpecialization() == spec) {
                    return vt;
                }
            }
        } catch (IllegalArgumentException ex) {

        }
        return null;
    }
}
