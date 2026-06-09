import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MessEnrollment, MessNotification, MessStats } from '../models/mess.model';
import { Student } from '../models/student.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MessService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly enrollments  = new BehaviorSubject<MessEnrollment[]>([]);
  private readonly notifications = new BehaviorSubject<MessNotification[]>([]);

  constructor() {
    this.refreshEnrollments();
    this.refreshNotifications();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refreshEnrollments(): void {
    this.http.get<ApiResponse<MessEnrollment[]>>(`${environment.apiUrl}/mess/enrollments`, { headers: this.headers })
      .subscribe({ next: res => this.enrollments.next(res.data), error: () => {} });
  }

  private refreshNotifications(): void {
    this.http.get<ApiResponse<MessNotification[]>>(`${environment.apiUrl}/mess/notifications`, { headers: this.headers })
      .subscribe({ next: res => this.notifications.next(res.data), error: () => {} });
  }

  // ── Enrollments ──────────────────────────────────────────────────────────

  getEnrollments(): Observable<MessEnrollment[]>  { return this.enrollments.asObservable(); }
  getEnrollmentsValue(): MessEnrollment[]         { return this.enrollments.value; }

  getTodayEnrollments(): MessEnrollment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.enrollments.value.filter(e => e.enrollmentDate === today && e.status !== 'cancelled');
  }

  getPendingEnrollments(): MessEnrollment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.enrollments.value.filter(e => e.enrollmentDate === today && e.status === 'enrolled');
  }

  getEnrollmentByCoupon(couponNumber: string): MessEnrollment | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.enrollments.value.find(e => e.couponNumber === couponNumber && e.enrollmentDate === today);
  }

  getTodayStats(): MessStats {
    const today = new Date().toISOString().split('T')[0];
    const todayEnrollments = this.enrollments.value.filter(e => e.enrollmentDate === today);
    return {
      totalSubscribed: todayEnrollments.filter(e => e.status !== 'cancelled').length,
      totalServed:     todayEnrollments.filter(e => e.status === 'served').length,
      pendingStudents: todayEnrollments.filter(e => e.status === 'enrolled').length,
      todayDate:       today,
    };
  }

  enrollStudent(student: Student, mealType: 'lunch' | 'dinner' | 'both' = 'both'): Observable<MessEnrollment> {
    return this.http.post<ApiResponse<MessEnrollment>>(
      `${environment.apiUrl}/mess/enrollments`,
      { studentId: student.id, mealType },
      { headers: this.headers }
    ).pipe(
      map(res => res.data),
      tap(created => this.enrollments.next([...this.enrollments.value, created]))
    );
  }

  validateAndServeCoupon(couponNumber: string, servedBy = 'Manager'): Observable<MessEnrollment | null> {
    const enrollment = this.getEnrollmentByCoupon(couponNumber);
    if (!enrollment) return new Observable(obs => { obs.next(null); obs.complete(); });

    return this.http.put<ApiResponse<MessEnrollment>>(
      `${environment.apiUrl}/mess/enrollments/${enrollment.id}/serve`,
      { servedBy },
      { headers: this.headers }
    ).pipe(
      map(res => res.data),
      tap(updated => {
        const list = this.enrollments.value.map(e => e.id === updated.id ? updated : e);
        this.enrollments.next(list);
      })
    );
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  getNotifications(): Observable<MessNotification[]>  { return this.notifications.asObservable(); }
  getNotificationsValue(): MessNotification[]         { return this.notifications.value; }

  addNotification(data: Omit<MessNotification, 'id' | 'createdAt' | 'isRead'>): void {
    this.http.post<ApiResponse<MessNotification>>(
      `${environment.apiUrl}/mess/notifications`,
      { ...data, priority: data.priority ?? 'medium' },
      { headers: this.headers }
    ).subscribe({
      next: res => this.notifications.next([res.data, ...this.notifications.value]),
      error: () => {}
    });
  }

  markNotificationAsRead(id: string): void {
    this.http.put<ApiResponse<MessNotification>>(
      `${environment.apiUrl}/mess/notifications/${id}/read`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: res => {
        const list = this.notifications.value.map(n => n.id === id ? res.data : n);
        this.notifications.next(list);
      },
      error: () => {}
    });
  }

  notifyNewStudent(studentName: string): void {
    this.addNotification({
      type: 'new_student',
      title: 'New Student Onboarded',
      message: `${studentName} has been added to the hostel system.`,
      priority: 'medium',
    });
  }

  addTimingNotification(mealType: 'lunch' | 'dinner', timing: string): void {
    const label = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    this.addNotification({ type: 'timing', title: `${label} Timing`, message: `${label} will be served at ${timing}`, priority: 'high' });
  }

  addAnnouncement(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    this.addNotification({ type: 'announcement', title, message, priority });
  }

  addAuditPublishedNotification(monthLabel: string, year: number, totalBill: number, perDay: number, studentCount: number): void {
    this.addNotification({
      type: 'audit',
      title: `Billing Audit Published — ${monthLabel} ${year}`,
      message: `${studentCount} students billed · Total: INR ${totalBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })} · Per day: INR ${perDay.toFixed(2)}`,
      priority: 'high',
    });
  }
}
