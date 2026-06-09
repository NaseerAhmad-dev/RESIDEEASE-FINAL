import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { GuestRegistration } from '../models/guest.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class GuestService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly guests = new BehaviorSubject<GuestRegistration[]>([]);

  constructor() {
    this.refresh();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refresh(): void {
    this.http.get<ApiResponse<GuestRegistration[]>>(`${environment.apiUrl}/guests`, { headers: this.headers })
      .subscribe({ next: res => this.guests.next(res.data), error: () => {} });
  }

  getGuests(): Observable<GuestRegistration[]> { return this.guests.asObservable(); }
  getGuestsValue(): GuestRegistration[]        { return this.guests.value; }

  generateOtp(phone: string): Observable<{ otp?: string }> {
    return this.http.post<ApiResponse<{ otp?: string }>>(`${environment.apiUrl}/guests/otp`, { phone })
      .pipe(map(res => res.data));
  }

  verifyOtp(phone: string, otp: string): Observable<boolean> {
    return this.http.post<ApiResponse<{ verified: boolean }>>(`${environment.apiUrl}/guests/verify`, { phone, otp })
      .pipe(map(res => res.data.verified));
  }

  registerGuest(data: Omit<GuestRegistration, 'id' | 'registeredAt' | 'receiptNumber'>): Observable<GuestRegistration> {
    return this.http.post<ApiResponse<GuestRegistration>>(`${environment.apiUrl}/guests/register`, data)
      .pipe(
        map(res => res.data),
        tap(guest => this.guests.next([...this.guests.value, guest]))
      );
  }

  getGuestFee(): number {
    return 200;
  }
}
