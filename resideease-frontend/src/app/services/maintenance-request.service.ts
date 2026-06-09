import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MaintenanceRequest } from '../models/maintenance-request.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MaintenanceRequestService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly requests = new BehaviorSubject<MaintenanceRequest[]>([]);

  constructor() { this.refresh(); }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refresh(): void {
    this.http.get<ApiResponse<MaintenanceRequest[]>>(`${environment.apiUrl}/maintenance`, { headers: this.headers })
      .subscribe({ next: res => this.requests.next(res.data), error: () => {} });
  }

  getRequests(): Observable<MaintenanceRequest[]> { return this.requests.asObservable(); }
  getRequestsValue(): MaintenanceRequest[]         { return this.requests.value; }

  createRequest(data: Omit<MaintenanceRequest, 'id' | 'ticketNumber' | 'status' | 'raisedAt' | 'resolvedAt'>): Observable<MaintenanceRequest> {
    return this.http.post<ApiResponse<MaintenanceRequest>>(`${environment.apiUrl}/maintenance`, data, { headers: this.headers })
      .pipe(map(res => res.data));
  }

  updateStatus(id: string, status: MaintenanceRequest['status']): void {
    this.http.put<ApiResponse<MaintenanceRequest>>(`${environment.apiUrl}/maintenance/${id}/status`, { status }, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: updated => this.requests.next(this.requests.value.map(r => r.id === id ? updated : r)),
        error: () => {}
      });
  }
}
