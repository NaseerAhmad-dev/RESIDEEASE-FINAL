import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Notice } from '../models/notice.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class NoticeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly notices = new BehaviorSubject<Notice[]>([]);

  constructor() {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  refresh(): void {
    const token = this.authService.getToken();
    if (!token) return;
    this.http.get<ApiResponse<Notice[]>>(`${environment.apiUrl}/notices`, { headers: this.headers })
      .subscribe({ next: res => this.notices.next(res.data), error: () => {} });
  }

  getNotices(): Observable<Notice[]> { return this.notices.asObservable(); }
  getNoticesValue(): Notice[]        { return this.notices.value; }

  addNotice(data: Omit<Notice, 'id' | 'createdAt'>): void {
    this.http.post<ApiResponse<Notice>>(`${environment.apiUrl}/notices`, data, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: created => this.notices.next([created, ...this.notices.value]),
        error: () => {}
      });
  }

  updateNotice(id: string, updates: Partial<Notice>): void {
    this.http.put<ApiResponse<Notice>>(`${environment.apiUrl}/notices/${id}`, updates, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: updated => this.notices.next(this.notices.value.map(n => n.id === id ? updated : n)),
        error: () => {}
      });
  }

  deleteNotice(id: string): void {
    this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/notices/${id}`, { headers: this.headers })
      .subscribe({
        next: () => this.notices.next(this.notices.value.filter(n => n.id !== id)),
        error: () => {}
      });
  }

  togglePin(id: string): void {
    this.http.put<ApiResponse<Notice>>(`${environment.apiUrl}/notices/${id}/pin`, {}, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: updated => this.notices.next(this.notices.value.map(n => n.id === id ? updated : n)),
        error: () => {}
      });
  }
}
