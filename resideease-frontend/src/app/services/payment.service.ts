import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { PaymentTransaction } from '../models/payment.model';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

export interface RecordPaymentPayload {
  studentId: string;
  amount:    number;
  method:    string;
  notes?:    string;
  paidAt:    string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  record(payload: RecordPaymentPayload): Observable<{ transaction: PaymentTransaction; student: any }> {
    return this.http
      .post<ApiResponse<any>>(`${environment.apiUrl}/payments`, payload, { headers: this.headers })
      .pipe(map(r => r.data));
  }

  getAll(): Observable<PaymentTransaction[]> {
    return this.http
      .get<ApiResponse<PaymentTransaction[]>>(`${environment.apiUrl}/payments`, { headers: this.headers })
      .pipe(map(r => r.data));
  }

  getByStudent(studentId: string): Observable<PaymentTransaction[]> {
    return this.http
      .get<ApiResponse<PaymentTransaction[]>>(
        `${environment.apiUrl}/payments/student/${studentId}`,
        { headers: this.headers }
      )
      .pipe(map(r => r.data));
  }
}
