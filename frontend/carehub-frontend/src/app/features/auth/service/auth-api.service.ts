import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_AUTH } from '../../../core/constants/api-endpoints';
import { SimpleResult } from '../../../core/models/simple-result.model';
import { RegisterUserPayload } from '@app/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private http: HttpClient) {}

  register(payload: RegisterUserPayload): Observable<SimpleResult> {
    return this.http.post<SimpleResult>(API_AUTH.REGISTER, payload);
  }

  registerPatient(payload: RegisterUserPayload): Observable<SimpleResult> {
    return this.http.post<SimpleResult>(API_AUTH.REGISTER_PATIENT, payload);
  }
}
