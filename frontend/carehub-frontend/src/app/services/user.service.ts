import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateUserPayload, User } from '@app/models/user.model';
import { SimpleResult } from '@app/core/models/simple-result.model';
import { API_USER } from '@app/core/constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(API_USER.BY_ID(id));
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(API_USER.BASE);
  }

  getAllUsersFiltered(active?: boolean): Observable<User[]> {
    if (active === undefined) {
      return this.getAllUsers();
    }
    return this.http.get<User[]>(API_USER.BASE, { params: { active: String(active) } });
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<SimpleResult> {
    return this.http.put<SimpleResult>(API_USER.BY_ID(id), payload);
  }

  deleteUser(id: number): Observable<SimpleResult> {
    return this.http.delete<SimpleResult>(API_USER.BY_ID(id));
  }

  deleteUserPermanent(id: number): Observable<SimpleResult> {
    return this.http.delete<SimpleResult>(API_USER.BY_ID_PERMANENT(id));
  }

  reactivateUser(id: number): Observable<SimpleResult> {
    return this.http.post<SimpleResult>(API_USER.BY_ID_REACTIVATE(id), {});
  }

  searchPatients(query: string): Observable<User[]> {
    return this.http.get<User[]>(API_USER.PATIENT_AUTOCOMPLETE, { params: { query } });
  }

    searchDoctors(query: string): Observable<User[]> {
    return this.http.get<User[]>(API_USER.DOCTOR_AUTOCOMPLETE, { params: { query } });
  }

  searchDoctorsByVisitType(query: string, visitType: string): Observable<User[]> {
    return this.http.get<User[]>(API_USER.DOCTOR_AUTOCOMPLETE, { params: { query, visitType } });
  }

  getVisitTypeByDoctorId(id: number): Observable<string[]> {
    return this.http.get<string[]>(API_USER.VISIT_TYPE_BY_DOCTOR_ID(id));
  }
}
