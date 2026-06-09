import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Student } from '../models/student.model';
import { MessService } from './mess.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly messService = inject(MessService);

  private readonly students = new BehaviorSubject<Student[]>([]);

  constructor() {
    this.refresh();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private refresh(): void {
    this.http.get<ApiResponse<Student[]>>(`${environment.apiUrl}/students`, { headers: this.headers })
      .subscribe({ next: res => this.students.next(res.data), error: () => {} });
  }

  getStudents(): Observable<Student[]> { return this.students.asObservable(); }
  getStudentsValue(): Student[]        { return this.students.value; }

  getStudentById(id: string): Student | undefined {
    return this.students.value.find(s => s.id === id);
  }

  addStudent(data: Omit<Student, 'id' | 'createdAt'>): Observable<Student> {
    return this.http.post<ApiResponse<Student>>(`${environment.apiUrl}/students`, data, { headers: this.headers }).pipe(
      map(res => res.data),
      tap(student => {
        this.students.next([...this.students.value, student]);
        this.messService.notifyNewStudent(`${student.firstName} ${student.lastName}`);
      })
    );
  }

  updateStudent(id: string, updates: Partial<Student>): void {
    this.http.put<ApiResponse<Student>>(`${environment.apiUrl}/students/${id}`, updates, { headers: this.headers })
      .subscribe({
        next: res => {
          const updated = this.students.value.map(s => s.id === id ? res.data : s);
          this.students.next(updated);
        },
        error: () => {}
      });
  }

  deleteStudent(id: string): void {
    this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/students/${id}`, { headers: this.headers })
      .subscribe({
        next: () => this.students.next(this.students.value.filter(s => s.id !== id)),
        error: () => {}
      });
  }
}
