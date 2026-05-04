import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { API_APPOINTMENT } from '@app/core/constants/api-endpoints';
import { Appointment } from '@app/models/appointment.model';
import { AppointmentPayload } from '@app/models/appointment-payload.model';
import { AppointmentFilter } from '@app/models/appointment-filter.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(API_APPOINTMENT.BASE);
  }

  getById(id: number, includeInactive: boolean = false): Observable<Appointment> {
    const url = includeInactive ? `${API_APPOINTMENT.BY_ID(id)}?includeInactive=true` : `${API_APPOINTMENT.BY_ID(id)}`;
    return this.http.get<Appointment>(url);
  }

  create(appointment: AppointmentPayload): Observable<SimpleResult> {
    return this.http.post<SimpleResult>(API_APPOINTMENT.BASE, appointment);
  }

  update(id: number, appointment: AppointmentPayload): Observable<SimpleResult> {
    return this.http.put<SimpleResult>(API_APPOINTMENT.BY_ID(id), appointment);
  }

  delete(id: number): Observable<SimpleResult> {
    return this.http.delete<SimpleResult>(API_APPOINTMENT.BY_ID(id));
  }

  filter(filter: AppointmentFilter): Observable<Appointment[]> {
    return this.http.post<Appointment[]>(API_APPOINTMENT.FILTER, filter);
  }

  getVisitTypes(): Observable<string[]> {
    return this.http.get<string[]>(API_APPOINTMENT.VISIT_TYPES);
  }

  getStatuses(): Observable<string[]> {
    return this.http.get<string[]>(API_APPOINTMENT.STATUSES);
  }
}
