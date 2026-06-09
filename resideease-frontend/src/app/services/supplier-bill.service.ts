import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupplierBill } from '../models/supplier-bill.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class SupplierBillService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly bills$ = new BehaviorSubject<SupplierBill[]>([]);

  constructor() { this.refresh(); }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refresh(): void {
    this.http.get<ApiResponse<SupplierBill[]>>(`${environment.apiUrl}/supplier-bills`, { headers: this.headers })
      .subscribe({ next: res => this.bills$.next(res.data), error: () => {} });
  }

  getBills(): Observable<SupplierBill[]> { return this.bills$.asObservable(); }

  addBill(bill: Omit<SupplierBill, 'id' | 'registeredAt' | 'status'>): void {
    this.http.post<ApiResponse<SupplierBill>>(`${environment.apiUrl}/supplier-bills`, bill, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: created => this.bills$.next([created, ...this.bills$.value]),
        error: () => {}
      });
  }

  updateStatus(id: string, status: SupplierBill['status']): void {
    this.http.put<ApiResponse<SupplierBill>>(`${environment.apiUrl}/supplier-bills/${id}/status`, { status }, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: updated => this.bills$.next(this.bills$.value.map(b => b.id === id ? updated : b)),
        error: () => {}
      });
  }

  deleteBill(id: string): void {
    this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/supplier-bills/${id}`, { headers: this.headers })
      .subscribe({
        next: () => this.bills$.next(this.bills$.value.filter(b => b.id !== id)),
        error: () => {}
      });
  }
}
