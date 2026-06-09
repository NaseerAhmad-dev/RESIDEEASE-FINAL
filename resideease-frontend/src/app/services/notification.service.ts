import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AdminNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly _notifications = signal<AdminNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount   = computed(() => this._notifications().filter(n => !n.isRead).length);

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  load(): void {
    this.http
      .get<{ success: boolean; data: AdminNotification[] }>(
        `${environment.apiUrl}/notifications`,
        { headers: this.headers() }
      )
      .subscribe({ next: res => { if (res.success) this._notifications.set(res.data); }, error: () => {} });
  }

  markRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    this.http
      .put(`${environment.apiUrl}/notifications/${id}/read`, {}, { headers: this.headers() })
      .subscribe({ error: () => {} });
  }

  markAllRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this.http
      .put(`${environment.apiUrl}/notifications/mark-all-read`, {}, { headers: this.headers() })
      .subscribe({ error: () => {} });
  }
}
