import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Employee {
  id:         string;
  name:       string;
  email:      string | null;
  phone:      string | null;
  jobTitle:   string;
  department: string | null;
  salary:     number | null;
  joinDate:   string;
  status:     string;
  role:       string;
  hostelId:   string | null;
  address:    string | null;
  notes:      string | null;
  createdAt:  string;
  updatedAt:  string;
}

export interface EmployeePayload {
  name:       string;
  jobTitle:   string;
  joinDate:   string;
  email?:     string | null;
  phone?:     string | null;
  department?: string | null;
  salary?:    number | null;
  status?:    string;
  role?:      string;
  password?:  string | null;
  hostelId?:  string | null;
  address?:   string | null;
  notes?:     string | null;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getAll(params?: { status?: string; department?: string; search?: string }): Observable<ApiResponse<Employee[]>> {
    const query = new URLSearchParams();
    if (params?.status)     query.set('status',     params.status);
    if (params?.department) query.set('department', params.department);
    if (params?.search)     query.set('search',     params.search);
    const qs = query.toString() ? `?${query}` : '';
    return this.http.get<ApiResponse<Employee[]>>(`${environment.apiUrl}/employees${qs}`, { headers: this.headers });
  }

  getById(id: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${environment.apiUrl}/employees/${id}`, { headers: this.headers });
  }

  create(payload: EmployeePayload): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${environment.apiUrl}/employees`, payload, { headers: this.headers });
  }

  update(id: string, payload: Partial<EmployeePayload>): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${environment.apiUrl}/employees/${id}`, payload, { headers: this.headers });
  }

  remove(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/employees/${id}`, { headers: this.headers });
  }
}
