import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RebateRequest, RebateDays } from '../models/rebate.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class RebateService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly requests = new BehaviorSubject<RebateRequest[]>([]);

  constructor() {
    this.refresh();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refresh(): void {
    this.http.get<ApiResponse<RebateRequest[]>>(`${environment.apiUrl}/rebates`, { headers: this.headers })
      .subscribe({ next: res => this.requests.next(res.data), error: () => {} });
  }

  getRequests(): Observable<RebateRequest[]> { return this.requests.asObservable(); }
  getRequestsValue(): RebateRequest[]        { return this.requests.value; }

  getActiveRebate(studentId: string): RebateRequest | undefined {
    return this.requests.value.find(r => r.studentId === studentId && (r.status === 'pending' || r.status === 'approved'));
  }

  getStudentHistory(studentId: string): RebateRequest[] {
    return this.requests.value.filter(r => r.studentId === studentId);
  }

  getPendingRequests(): RebateRequest[] {
    return this.requests.value.filter(r => r.status === 'pending');
  }

  getAllManagerRequests(): RebateRequest[] {
    return [...this.requests.value].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  submitRequest(studentId: string, _studentName: string, _rollNumber: string, days: RebateDays): Observable<RebateRequest> {
    return this.http.post<ApiResponse<RebateRequest>>(
      `${environment.apiUrl}/rebates`,
      { studentId, days },
      { headers: this.headers }
    ).pipe(
      map(res => res.data),
      tap(request => this.requests.next([...this.requests.value, request]))
    );
  }

  cancelRequest(id: string): void {
    this.http.put<ApiResponse<RebateRequest>>(`${environment.apiUrl}/rebates/${id}/cancel`, {}, { headers: this.headers })
      .subscribe({
        next: res => this.requests.next(this.requests.value.map(r => r.id === id ? res.data : r)),
        error: () => {}
      });
  }

  approveRequest(id: string, reviewedBy = 'Manager'): void {
    this.http.put<ApiResponse<RebateRequest>>(`${environment.apiUrl}/rebates/${id}/approve`, { reviewedBy }, { headers: this.headers })
      .subscribe({
        next: res => this.requests.next(this.requests.value.map(r => r.id === id ? res.data : r)),
        error: () => {}
      });
  }

  rejectRequest(id: string, reviewedBy = 'Manager'): void {
    this.http.put<ApiResponse<RebateRequest>>(`${environment.apiUrl}/rebates/${id}/reject`, { reviewedBy }, { headers: this.headers })
      .subscribe({
        next: res => this.requests.next(this.requests.value.map(r => r.id === id ? res.data : r)),
        error: () => {}
      });
  }
}
