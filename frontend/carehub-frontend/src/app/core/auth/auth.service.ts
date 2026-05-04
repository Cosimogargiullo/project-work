import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';
import { API_AUTH } from '../constants/api-endpoints';

interface LoginResponse { accessToken: string }
type JwtPayload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'carehub_token';
  private readonly rolesKey = 'carehub_roles';
  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.isTokenValid());
  isAuthenticated$ = this._isAuthenticated$.asObservable();

  constructor(private http: HttpClient) {}

  // Synchronous helper for templates/components
  isAuthenticated(): boolean {
    return this._isAuthenticated$.value;
  }

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(API_AUTH.LOGIN, { username, password }).pipe(
      map(res => {
        sessionStorage.setItem(this.tokenKey, res.accessToken);
        const roles = this.extractRoles(res.accessToken);
        sessionStorage.setItem(this.rolesKey, JSON.stringify(roles));
        this._isAuthenticated$.next(true);
        return true;
      })
    );
  }

  logout() {
    // Svuota completamente la sessionStorage alla disconnessione
    sessionStorage.clear();
    this._isAuthenticated$.next(false);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getRoles(): string[] {
    const str = sessionStorage.getItem(this.rolesKey);
    return str ? JSON.parse(str) : [];
  }

  hasRole(required: string | string[]): boolean {
    const roles = this.getRoles();
    const req = Array.isArray(required) ? required : [required];
    return req.some(r => roles.includes(r));
  }

  getUsername(): string | null {
    const payload = this.decodePayload();
    const sub = payload?.['sub'];
    const username = payload?.['username'];
    if (typeof sub === 'string') {
      return sub;
    }
    if (typeof username === 'string') {
      return username;
    }
    return null;
  }

  getUserId(): number | null {
    const payload = this.decodePayload();
    const userId = payload?.['userId'];
    const id = payload?.['id'];
    const value = typeof userId === 'number' ? userId : typeof id === 'number' ? id : null;
    return value;
  }

  private extractRoles(token: string): string[] {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
      const roles = payload['roles'];
      return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : [];
    } catch {
      return [];
    }
  }

  private isTokenValid(): boolean {
    const payload = this.decodePayload();
    const exp = payload?.['exp'];
    if (typeof exp !== 'number') {
      return false;
    }

    // exp è in secondi, Date.now() è in millisecondi
    const expirationTime = exp * 1000;
    return Date.now() < expirationTime;
  }

  private decodePayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }
}
