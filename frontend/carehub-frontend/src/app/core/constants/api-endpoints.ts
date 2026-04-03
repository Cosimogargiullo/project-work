type RuntimeEnvWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

const runtimeWindow = window as RuntimeEnvWindow;
const API_PREFIX = runtimeWindow.__env?.API_BASE_URL || '';

// ===================== AUTH =====================
export const API_AUTH = {
  REGISTER: `${API_PREFIX}/api/auth/register-user`,
  REGISTER_PATIENT: `${API_PREFIX}/api/auth/register-patient`,
  LOGIN: `${API_PREFIX}/api/auth/login`,
  // ...altre API di autenticazione
};

// ===================== USER =====================
export const API_USER = {
  BASE: `${API_PREFIX}/api/users`,
  BY_ID: (id: number | string) => `${API_PREFIX}/api/users/${id}`,
  BY_ID_REACTIVATE: (id: number | string) => `${API_PREFIX}/api/users/${id}/reactivate`,
  BY_ID_PERMANENT: (id: number | string) => `${API_PREFIX}/api/users/${id}/permanent`,
  PATIENT_AUTOCOMPLETE: `${API_PREFIX}/api/users/patient-autocomplete`,
  DOCTOR_AUTOCOMPLETE: `${API_PREFIX}/api/users/doctor-autocomplete`,
  VISIT_TYPE_BY_DOCTOR_ID: (id: number | string) => `${API_PREFIX}/api/users/${id}/visit-type`
};

// ===================== APPOINTMENT =====================
export const API_APPOINTMENT = {
  BASE: `${API_PREFIX}/api/appointments`,
  BY_ID: (id: number | string) => `${API_PREFIX}/api/appointments/${id}`,
  FILTER: `${API_PREFIX}/api/appointments/filter`,
  VISIT_TYPES: `${API_PREFIX}/api/appointments/visit-types`,
  STATUSES: `${API_PREFIX}/api/appointments/statuses`
};

// ===================== DOCTOR =====================
// export const API_DOCTOR = {
//   ...
// };

// ===================== PATIENT =====================
// export const API_PATIENT = {
//   ...
// };

// ===================== AVAILABILITY =====================
export const API_AVAILABILITY = {
  BASE: `${API_PREFIX}/api/availabilities`,
  BY_ID: (id: number | string) => `${API_PREFIX}/api/availabilities/${id}`,
  BY_DOCTOR: (doctorId: number | string) => `${API_PREFIX}/api/availabilities/doctor/${doctorId}`,
  BY_DOCTOR_AND_DATE: (doctorId: number | string, date: string) =>
    `${API_PREFIX}/api/availabilities/doctor/${doctorId}/date/${date}`,
  DURATIONS: `${API_PREFIX}/api/availabilities/durations`
};

// ===================== REPORT =====================
export const API_REPORT = {
  BASE: `${API_PREFIX}/api/reports`,
  BY_ID: (id: number | string) => `${API_PREFIX}/api/reports/${id}`,
  FILE: (id: number | string) => `${API_PREFIX}/api/reports/${id}/file`,
  FILTER: `${API_PREFIX}/api/reports/filter`
};

// ===================== ANALYTICS =====================
export const API_REPORT_ANALYTICS = {
  BASE: `${API_PREFIX}/api/reports/analytics`,

  // Overview
  OVERVIEW_ALL: `${API_PREFIX}/api/reports/analytics/overview`,
  OVERVIEW_BY_PATIENT: (patientId: number | string) =>
    `${API_PREFIX}/api/reports/analytics/patient/${patientId}/overview`,
  OVERVIEW_BY_DOCTOR: (doctorId: number | string) =>
    `${API_PREFIX}/api/reports/analytics/doctor/${doctorId}/overview`,

  // Monthly
  MONTHLY_ALL: `${API_PREFIX}/api/reports/analytics/monthly`,
  MONTHLY_BY_PATIENT: (patientId: number | string) =>
    `${API_PREFIX}/api/reports/analytics/patient/${patientId}/monthly`,
  MONTHLY_BY_DOCTOR: (doctorId: number | string) =>
    `${API_PREFIX}/api/reports/analytics/doctor/${doctorId}/monthly`,

  // Revenue by doctor
  BY_DOCTOR: `${API_PREFIX}/api/reports/analytics/by-doctor`
};

// ===================== RESULT CONSTANTS =====================
export const RESULT_OK = 'OK';
export const RESULT_KO = 'KO';
