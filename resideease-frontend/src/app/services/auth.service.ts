import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const API = environment.apiUrl;
const TOKEN_KEY = 'resideease_token';
const USER_KEY  = 'resideease_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  loginManager(username: string, password: string): Observable<{ success: boolean; data: { token: string; user: any } }> {
    return this.http.post<any>(`${API}/auth/login`, { username, password }).pipe(
      tap(res => { if (res.success) this.saveSession(res.data.token, res.data.user); })
    );
  }

  loginEmployee(email: string, password: string): Observable<{ success: boolean; data: { token: string; user: any } }> {
    return this.http.post<any>(`${API}/auth/employee/login`, { email, password }).pipe(
      tap(res => { if (res.success) this.saveSession(res.data.token, res.data.user); })
    );
  }

  loginStudent(rollNumber: string, credential: string, isPhone = false): Observable<{ success: boolean; data: { token: string; user: any } }> {
    const body = isPhone ? { rollNumber, phone: credential } : { rollNumber, password: credential };
    return this.http.post<any>(`${API}/auth/student/login`, body).pipe(
      tap(res => { if (res.success) this.saveSession(res.data.token, res.data.user); })
    );
  }

  saveSession(token: string, user: any): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): any {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getHostelId(): string | null {
    return this.getUser()?.hostelId ?? null;
  }

  isOnboardingCompleted(): boolean {
    return this.getUser()?.onboardingCompleted === true;
  }

  markOnboardingComplete(): void {
    const user = this.getUser();
    if (user) {
      user.onboardingCompleted = true;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
