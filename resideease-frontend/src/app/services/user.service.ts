import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface StaffUser {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  roleDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  role: string;
  name?: string;
  email?: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: string;
  name?: string;
  email?: string;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  listUsers(): Observable<ApiResponse<StaffUser[]>> {
    return this.http.get<ApiResponse<StaffUser[]>>(`${environment.apiUrl}/users`, { headers: this.headers });
  }

  listRoles(): Observable<ApiResponse<{ id: string; name: string; description: string }[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/users/roles`, { headers: this.headers });
  }

  createUser(payload: CreateUserPayload): Observable<ApiResponse<StaffUser>> {
    return this.http.post<ApiResponse<StaffUser>>(`${environment.apiUrl}/users`, payload, { headers: this.headers });
  }

  updateUser(id: string, payload: UpdateUserPayload): Observable<ApiResponse<StaffUser>> {
    return this.http.put<ApiResponse<StaffUser>>(`${environment.apiUrl}/users/${id}`, payload, { headers: this.headers });
  }

  deleteUser(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/users/${id}`, { headers: this.headers });
  }
}
