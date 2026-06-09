import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface StudentNotification {
  id:        string;
  studentId: string;
  type:      'bill' | 'announcement' | 'info';
  title:     string;
  message:   string;
  isRead:    boolean;
  createdAt: string;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class StudentNotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly notifs$ = new BehaviorSubject<StudentNotification[]>([]);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private loadForStudent(studentId: string): void {
    this.http.get<ApiResponse<StudentNotification[]>>(
      `${environment.apiUrl}/student-notifications/student/${studentId}`, { headers: this.headers }
    ).subscribe({ next: res => this.notifs$.next(res.data), error: () => {} });
  }

  getForStudent(studentId: string): Observable<StudentNotification[]> {
    this.loadForStudent(studentId);
    return this.notifs$.pipe(
      map(all => all
        .filter(n => n.studentId === studentId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    );
  }

  getUnreadCount(studentId: string): Observable<number> {
    return this.notifs$.pipe(
      map(all => all.filter(n => n.studentId === studentId && !n.isRead).length)
    );
  }

  addMany(items: Omit<StudentNotification, 'id' | 'createdAt' | 'isRead'>[]): void {
    this.http.post<ApiResponse<null>>(`${environment.apiUrl}/student-notifications`, { items }, { headers: this.headers })
      .subscribe({ error: () => {} });
  }

  markRead(id: string): void {
    this.http.put<ApiResponse<StudentNotification>>(
      `${environment.apiUrl}/student-notifications/${id}/read`, {}, { headers: this.headers }
    ).pipe(map(res => res.data)).subscribe({
      next: updated => this.notifs$.next(this.notifs$.value.map(n => n.id === id ? updated : n)),
      error: () => {}
    });
  }

  markAllReadForStudent(studentId: string): void {
    this.http.put<ApiResponse<null>>(
      `${environment.apiUrl}/student-notifications/student/${studentId}/read-all`, {}, { headers: this.headers }
    ).subscribe({
      next: () => this.notifs$.next(this.notifs$.value.map(n => n.studentId === studentId ? { ...n, isRead: true } : n)),
      error: () => {}
    });
  }
}
