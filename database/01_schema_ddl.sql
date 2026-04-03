--------------------------------------------------

-- CLEANUP (idempotente)

--------------------------------------------------

DROP SCHEMA IF EXISTS carehub CASCADE;

--------------------------------------------------

-- SCHEMA

--------------------------------------------------

CREATE SCHEMA carehub;

SET search_path TO carehub;

--------------------------------------------------

-- ENUM TYPES

--------------------------------------------------

-- Stati appuntamento
CREATE TYPE appointment_status AS ENUM (

    'PRENOTATO',
    'EFFETTUATA'

);

-- Ruoli utente (allineati al backend)
CREATE TYPE user_role AS ENUM (

    'ADMIN',

    'MEDICO',

    'SEGRETERIA',

    'PAZIENTE'

);

-- Durata slot di disponibilità (in minuti)
CREATE TYPE availability_duration AS ENUM (

    'MIN_60'

);

-- Specializzazioni mediche
CREATE TYPE specialization_type AS ENUM (

    'CARDIOLOGIA',

    'ORTOPEDIA',

    'DERMATOLOGIA'

);

-- Tipi di visita (prestazioni)
CREATE TYPE visit_type AS ENUM (

    'VISITA_CARDIOLOGICA',

    'VISITA_ORTOPEDICA',

    'VISITA_DERMATOLOGICA'

);

--------------------------------------------------

-- SEQUENCES

--------------------------------------------------

CREATE SEQUENCE seq_user START 1;

CREATE SEQUENCE seq_appointment START 1;

CREATE SEQUENCE seq_medical_report START 1;

CREATE SEQUENCE seq_available_dates START 1;

--------------------------------------------------

-- TABLES: ANAGRAFICHE

--------------------------------------------------

-- Users (unificata: anagrafica + credenziali + ruoli)
CREATE TABLE users (

    id              BIGINT PRIMARY KEY DEFAULT nextval('seq_user'),

    username        VARCHAR(50) NOT NULL UNIQUE,

    email           VARCHAR(100) UNIQUE,

    password_hash   VARCHAR(255) NOT NULL,

    -- campi anagrafici comuni
    first_name      VARCHAR(50),

    last_name       VARCHAR(50),

    fiscal_code     VARCHAR(16) UNIQUE,

    birth_date      DATE,

    phone           VARCHAR(20),

    specialization      specialization_type,

    active              BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT chk_users_username_not_blank CHECK (length(trim(username)) > 0),
    CONSTRAINT chk_users_email_format CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT chk_users_fiscal_code_format CHECK (
        fiscal_code IS NULL OR fiscal_code ~ '^[A-Z0-9]{16}$'
    ),
    CONSTRAINT chk_users_birth_date_not_future CHECK (
        birth_date IS NULL OR birth_date <= CURRENT_DATE
    ),
    CONSTRAINT chk_users_phone_format CHECK (
        phone IS NULL OR phone ~ '^[0-9+()\-\s]{7,20}$'
    )

);

CREATE TABLE user_roles (

    user_id     BIGINT NOT NULL,

    role        user_role NOT NULL,

    PRIMARY KEY (user_id, role),

    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

);

--------------------------------------------------

-- TABLES: OPERATIVE

--------------------------------------------------

-- TABLES: AVAILABLE DATES

CREATE TABLE available_dates (
    id               BIGINT PRIMARY KEY DEFAULT nextval('seq_available_dates'),
    doctor_id        BIGINT NOT NULL,
    available_day    DATE NOT NULL,
    available_time   TIME WITHOUT TIME ZONE NOT NULL,
    duration_minutes availability_duration NOT NULL DEFAULT 'MIN_60',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    is_booked        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_available_dates_doctor FOREIGN KEY (doctor_id) REFERENCES users(id),
    CONSTRAINT uq_available_dates UNIQUE (doctor_id, available_day, available_time),
    CONSTRAINT uq_available_dates_ref UNIQUE (id, doctor_id, available_day, available_time)
);

-- Appointment

CREATE TABLE appointment (

    id              BIGINT PRIMARY KEY DEFAULT nextval('seq_appointment'),

    patient_id      BIGINT NOT NULL,

    doctor_id       BIGINT NOT NULL,

    availability_id BIGINT,

    visit_type      visit_type NOT NULL,

    appointment_day DATE NOT NULL,

    appointment_time TIME WITHOUT TIME ZONE NOT NULL,

    status          appointment_status NOT NULL DEFAULT 'PRENOTATO',

    -- flag per soft-delete / visibilità
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    notes           TEXT,

    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES users(id),

    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES users(id),

    CONSTRAINT fk_appointment_availability FOREIGN KEY (availability_id) REFERENCES available_dates(id),

    CONSTRAINT fk_appointment_availability_consistency
        FOREIGN KEY (availability_id, doctor_id, appointment_day, appointment_time)
        REFERENCES available_dates(id, doctor_id, available_day, available_time),

    CONSTRAINT uq_appointment_doctor_datetime UNIQUE (doctor_id, appointment_day, appointment_time),
    CONSTRAINT chk_appointment_distinct_roles CHECK (patient_id <> doctor_id)

);

-- Medical Report

CREATE TABLE medical_report (

    id              BIGINT PRIMARY KEY DEFAULT nextval('seq_medical_report'),

    appointment_id  BIGINT NOT NULL UNIQUE,

    patient_id      BIGINT NOT NULL,

    doctor_id       BIGINT NOT NULL,

    -- dati clinici sintetici del referto
    summary         TEXT,

    notes           TEXT,

    -- costo effettivo della prestazione (per dashboard economica)
    cost            NUMERIC(10,2) NOT NULL,

    -- metadati e contenuto del PDF del referto
    file_name       VARCHAR(255) NOT NULL,

    content_type    VARCHAR(100) NOT NULL,

    pdf_content     BYTEA NOT NULL,

    -- data/ora di creazione del referto
    report_date     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_appointment FOREIGN KEY (appointment_id) REFERENCES appointment(id),

    CONSTRAINT fk_report_patient FOREIGN KEY (patient_id) REFERENCES users(id),

    CONSTRAINT fk_report_doctor FOREIGN KEY (doctor_id) REFERENCES users(id),
    CONSTRAINT chk_medical_report_cost_positive CHECK (cost > 0)

);

--------------------------------------------------

-- TRIGGERS: BUSINESS INTEGRITY

--------------------------------------------------

CREATE OR REPLACE FUNCTION carehub.assert_user_has_role(p_user_id BIGINT, p_role carehub.user_role, p_field TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM carehub.user_roles ur
        WHERE ur.user_id = p_user_id
          AND ur.role = p_role
    ) THEN
        RAISE EXCEPTION '% (%) must have role %', p_field, p_user_id, p_role;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION carehub.trg_validate_available_date_doctor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM carehub.assert_user_has_role(NEW.doctor_id, 'MEDICO'::carehub.user_role, 'doctor_id');
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_available_date_doctor_role
BEFORE INSERT OR UPDATE ON available_dates
FOR EACH ROW
EXECUTE FUNCTION trg_validate_available_date_doctor_role();

CREATE OR REPLACE FUNCTION carehub.trg_validate_appointment_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM carehub.assert_user_has_role(NEW.doctor_id, 'MEDICO'::carehub.user_role, 'doctor_id');
    PERFORM carehub.assert_user_has_role(NEW.patient_id, 'PAZIENTE'::carehub.user_role, 'patient_id');
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_appointment_roles
BEFORE INSERT OR UPDATE ON appointment
FOR EACH ROW
EXECUTE FUNCTION trg_validate_appointment_roles();

CREATE OR REPLACE FUNCTION carehub.trg_validate_report_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    appt_patient_id BIGINT;
    appt_doctor_id BIGINT;
BEGIN
    PERFORM carehub.assert_user_has_role(NEW.doctor_id, 'MEDICO'::carehub.user_role, 'doctor_id');
    PERFORM carehub.assert_user_has_role(NEW.patient_id, 'PAZIENTE'::carehub.user_role, 'patient_id');

    SELECT a.patient_id, a.doctor_id
      INTO appt_patient_id, appt_doctor_id
    FROM carehub.appointment a
    WHERE a.id = NEW.appointment_id;

    IF appt_patient_id IS NULL THEN
        RAISE EXCEPTION 'appointment_id (%) not found', NEW.appointment_id;
    END IF;

    IF NEW.patient_id <> appt_patient_id OR NEW.doctor_id <> appt_doctor_id THEN
        RAISE EXCEPTION 'report patient/doctor do not match appointment %', NEW.appointment_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_report_integrity
BEFORE INSERT OR UPDATE ON medical_report
FOR EACH ROW
EXECUTE FUNCTION trg_validate_report_integrity();
--------------------------------------------------

-- INDEXES

--------------------------------------------------

CREATE INDEX idx_user_fiscal_code ON users(fiscal_code);

CREATE INDEX idx_user_specialization ON users(specialization);

CREATE INDEX idx_appointment_datetime ON appointment(appointment_day, appointment_time);

CREATE INDEX idx_appointment_patient ON appointment(patient_id);

CREATE INDEX idx_appointment_doctor ON appointment(doctor_id);
CREATE INDEX idx_appointment_doctor_status_day ON appointment(doctor_id, status, appointment_day);
CREATE INDEX idx_appointment_patient_status_day ON appointment(patient_id, status, appointment_day);

CREATE INDEX idx_medical_report_patient ON medical_report(patient_id);

CREATE INDEX idx_medical_report_doctor ON medical_report(doctor_id);

CREATE INDEX idx_medical_report_created_at ON medical_report(created_at);
CREATE INDEX idx_medical_report_report_date ON medical_report(report_date);

-- Visit type index (enum)
CREATE INDEX idx_appointment_visit_type ON appointment(visit_type);

-- Functional indexes for case-insensitive search
CREATE INDEX idx_user_email_lower ON users (lower(email));
CREATE INDEX idx_user_last_name_lower ON users (lower(last_name));

--------------------------------------------------

-- INDEXES FOR AVAILABLE DATES

--------------------------------------------------

CREATE INDEX idx_available_dates_doctor ON available_dates(doctor_id);
CREATE INDEX idx_available_dates_date ON available_dates(available_day, available_time);
CREATE INDEX idx_available_dates_doctor_day_flags ON available_dates(doctor_id, available_day, is_active, is_booked);
