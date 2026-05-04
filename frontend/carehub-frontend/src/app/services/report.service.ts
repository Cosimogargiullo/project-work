import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { API_REPORT } from '@app/core/constants/api-endpoints';
import { MedicalReport } from '@app/models/medical-report.model';
import { MedicalReportFilter } from '@app/models/medical-report-filter.model';

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(API_REPORT.BASE);
  }

  getMyReports(): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(`${API_REPORT.BASE}/me`);
  }

  getDoctorReports(): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(`${API_REPORT.BASE}/doctor/me`);
  }

  getById(id: number): Observable<MedicalReport> {
    return this.http.get<MedicalReport>(API_REPORT.BY_ID(id));
  }

  filter(filter: MedicalReportFilter): Observable<MedicalReport[]> {
    return this.http.post<MedicalReport[]>(API_REPORT.FILTER, filter);
  }

  getByUserId(userId: number, role: string): Observable<MedicalReport[]> {
    // backend exposes /patient/{id} and /doctor/{id}; route based on role
    if (role && role.toUpperCase().includes('PAZIENTE')) {
      return this.getByPatientId(userId);
    }
    if (role && role.toUpperCase().includes('MEDICO')) {
      return this.getByDoctorId(userId);
    }
    // fallback to patient endpoint
    return this.getByPatientId(userId);
  }

  getByPatientId(patientId: number): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(`${API_REPORT.BASE}/patient/${patientId}`);
  }

  getByDoctorId(doctorId: number): Observable<MedicalReport[]> {
    return this.http.get<MedicalReport[]>(`${API_REPORT.BASE}/doctor/${doctorId}`);
  }

  create(formData: FormData): Observable<SimpleResult> {
    return this.http.post<SimpleResult>(API_REPORT.BASE, formData);
  }

  update(id: number, formData: FormData): Observable<SimpleResult> {
    return this.http.put<SimpleResult>(API_REPORT.BY_ID(id), formData);
  }

  downloadFile(id: number): Observable<Blob> {
    return this.http.get(API_REPORT.FILE(id), { responseType: 'blob' });
  }

  delete(id: number): Observable<SimpleResult> {
    return this.http.delete<SimpleResult>(API_REPORT.BY_ID(id));
  }
}
