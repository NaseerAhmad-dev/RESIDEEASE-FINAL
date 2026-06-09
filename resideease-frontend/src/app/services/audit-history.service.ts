import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface PublishedAuditRow {
  studentId:    string;
  studentName:  string;
  rollNumber:   string;
  rebateDays:   number;
  billableDays: number;
  billAmount:   number;
}

export interface PublishedAudit {
  id:                string;
  month:             number;
  year:              number;
  publishedAt:       string;
  daysInMonth:       number;
  totalSupplierBill: number;
  totalBillableDays: number;
  perDayRate:        number;
  studentCount:      number;
  rebatedCount:      number;
  totalStudentBill:  number;
  rows:              PublishedAuditRow[];
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class AuditHistoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly audits$ = new BehaviorSubject<PublishedAudit[]>([]);

  constructor() { this.refresh(); }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refresh(): void {
    this.http.get<ApiResponse<PublishedAudit[]>>(`${environment.apiUrl}/audit`, { headers: this.headers })
      .subscribe({ next: res => this.audits$.next(res.data), error: () => {} });
  }

  getAll(): Observable<PublishedAudit[]> { return this.audits$.asObservable(); }

  getForMonth(month: number, year: number): PublishedAudit | undefined {
    return this.audits$.getValue().find(a => a.month === month && a.year === year);
  }

  publish(data: Omit<PublishedAudit, 'id' | 'publishedAt'>): Observable<PublishedAudit> {
    return this.http.post<ApiResponse<PublishedAudit>>(`${environment.apiUrl}/audit`, data, { headers: this.headers })
      .pipe(
        map(res => res.data),
        map(audit => {
          const rest = this.audits$.getValue().filter(a => !(a.month === audit.month && a.year === audit.year));
          this.audits$.next([audit, ...rest].sort((a, b) => b.year - a.year || b.month - a.month));
          return audit;
        })
      );
  }
}
