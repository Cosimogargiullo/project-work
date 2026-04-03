import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SimpleResult } from '../core/models/simple-result.model';
import { AvailabilityPayload } from '@app/models/availability-payload.model';
import { AvailabilitySlot } from '@app/models/availability-slot.model';
import { API_AVAILABILITY } from '@app/core/constants/api-endpoints';
import { TimeSlot } from '@app/models/time-slot.model';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  constructor(private http: HttpClient) { }

  getAllAvailability(): Observable<AvailabilitySlot[]> {
    return this.getAllAvailabilityFiltered();
  }

  getAllAvailabilityFiltered(isActive?: boolean): Observable<AvailabilitySlot[]> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<AvailabilitySlot[]>(API_AVAILABILITY.BASE, { params });
  }

  getAvailability(doctorId: number): Observable<AvailabilitySlot[]> {
    return this.getAvailabilityFiltered(doctorId);
  }

  getAvailabilityFiltered(doctorId: number, isActive?: boolean): Observable<AvailabilitySlot[]> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<AvailabilitySlot[]>(API_AVAILABILITY.BY_DOCTOR(doctorId), { params });
  }

  getSlotsDetailsByDoctorAndDate(doctorId: number, date: string, isActive?: boolean, notBooked?: boolean): Observable<AvailabilityPayload> {
    let params = new HttpParams().set('date', date);
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    if (notBooked !== undefined) {
      params = params.set('notBooked', String(notBooked));
    }
    return this.http.get<AvailabilityPayload>(API_AVAILABILITY.BY_DOCTOR_AND_DATE(doctorId, date), { params });
  }

  createAvailability(data: AvailabilityPayload): Observable<SimpleResult> {
    return this.http.post<SimpleResult>(API_AVAILABILITY.BASE, data);
  }

  updateAvailability(data: AvailabilityPayload): Observable<SimpleResult> {
    return this.http.put<SimpleResult>(API_AVAILABILITY.BASE, data);
  }

  deleteAvailability(doctorId: number, date: string): Observable<SimpleResult> {
    return this.http.delete<SimpleResult>(API_AVAILABILITY.BY_DOCTOR_AND_DATE(doctorId, date));
  }

  getDurations(): Observable<string[]> {
    return this.http.get<string[]>(API_AVAILABILITY.DURATIONS);
  }

  getSlotsForDoctorAndDate(doctorId: number, date: string, isActive?: boolean, notBooked?: boolean): Observable<TimeSlot[]> {
    // Chiediamo al backend gli slot già filtrati per data (e opzionalmente per isActive e notBooked)
    return this.getSlotsDetailsByDoctorAndDate(doctorId, date, isActive, notBooked).pipe(
      map((payload: AvailabilityPayload) => {
        if (!payload || !payload.slots) {
          return [] as TimeSlot[];
        }
        return payload.slots;
      })
    );
  }

  getAvailabilityById(id: number): Observable<AvailabilitySlot> {
    return this.http.get<AvailabilitySlot>(API_AVAILABILITY.BY_ID(id));
  }

}
