import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'available' | 'occupied' | 'maintenance';
  studentId: string | null;
  student?: { id: string; firstName: string; lastName: string; rollNumber: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class BedService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getByRoom(roomId: string): Observable<Bed[]> {
    return this.http
      .get<ApiResponse<Bed[]>>(`${environment.apiUrl}/rooms/${roomId}/beds`, { headers: this.headers })
      .pipe(map(r => r.data));
  }

  bulkCreate(roomId: string, beds: { bedNumber: string; status?: string }[]): Observable<Bed[]> {
    return this.http
      .post<ApiResponse<Bed[]>>(`${environment.apiUrl}/rooms/${roomId}/beds/bulk`, { beds }, { headers: this.headers })
      .pipe(map(r => r.data));
  }

  updateBed(bedId: string, data: Partial<Pick<Bed, 'status' | 'studentId'>>): Observable<Bed> {
    return this.http
      .put<ApiResponse<Bed>>(`${environment.apiUrl}/rooms/beds/${bedId}`, data, { headers: this.headers })
      .pipe(map(r => r.data));
  }
}
