import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_REPORT_ANALYTICS } from '@app/core/constants/api-endpoints';
import { Observable } from 'rxjs';
import { AnalyticsOverview, DoctorRevenue, MonthlyRevenue } from '@app/core/models/analytics.models';


@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  getOverviewAll(from?: string, to?: string): Observable<AnalyticsOverview> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<AnalyticsOverview>(API_REPORT_ANALYTICS.OVERVIEW_ALL, { params });
  }

  getOverviewByPatient(patientId: number | string, from?: string, to?: string): Observable<AnalyticsOverview> {
    const url = API_REPORT_ANALYTICS.OVERVIEW_BY_PATIENT(patientId);
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<AnalyticsOverview>(url, { params });
  }

  getOverviewByDoctor(doctorId: number | string, from?: string, to?: string): Observable<AnalyticsOverview> {
    const url = API_REPORT_ANALYTICS.OVERVIEW_BY_DOCTOR(doctorId);
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<AnalyticsOverview>(url, { params });
  }

  getMonthlyAll(from?: string, to?: string): Observable<MonthlyRevenue[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<MonthlyRevenue[]>(API_REPORT_ANALYTICS.MONTHLY_ALL, { params });
  }

  getByDoctor(from?: string, to?: string, limit?: number): Observable<DoctorRevenue[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (limit) params = params.set('limit', String(limit));
    return this.http.get<DoctorRevenue[]>(API_REPORT_ANALYTICS.BY_DOCTOR, { params });
  }

  getMonthlyByDoctor(doctorId: number | string, from?: string, to?: string): Observable<MonthlyRevenue[]> {
    const url = API_REPORT_ANALYTICS.MONTHLY_BY_DOCTOR(doctorId);
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<MonthlyRevenue[]>(url, { params });
  }

  getMonthlyByPatient(patientId: number | string, from?: string, to?: string): Observable<MonthlyRevenue[]> {
    const url = API_REPORT_ANALYTICS.MONTHLY_BY_PATIENT(patientId);
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<MonthlyRevenue[]>(url, { params });
  }
}
