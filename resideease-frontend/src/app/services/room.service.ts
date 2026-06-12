import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Room } from '../models/room.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly rooms = new BehaviorSubject<Room[]>([]);

  constructor() {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  refresh(): void {
    const token = this.authService.getToken();
    if (!token) return;
    this.http.get<ApiResponse<Room[]>>(`${environment.apiUrl}/rooms`, { headers: this.headers })
      .subscribe({ next: res => this.rooms.next(res.data), error: () => {} });
  }

  getRooms(): Observable<Room[]>  { return this.rooms.asObservable(); }
  getRoomsValue(): Room[]         { return this.rooms.value; }
  getRoomById(id: string): Room | undefined { return this.rooms.value.find(r => r.id === id); }

  createRoom(data: Omit<Room, 'id' | 'createdAt' | 'beds'>): Observable<Room> {
    return this.http
      .post<ApiResponse<Room>>(`${environment.apiUrl}/rooms`, data, { headers: this.headers })
      .pipe(map(res => {
        const updated = [res.data, ...this.rooms.value];
        this.rooms.next(updated);
        return res.data;
      }));
  }

  bulkImport(rooms: Partial<Room>[]): Observable<{ created: Room[]; skipped: string[]; errors: { roomNumber: string; error: string }[] }> {
    return this.http
      .post<ApiResponse<any>>(`${environment.apiUrl}/rooms/bulk`, { rooms }, { headers: this.headers })
      .pipe(map(res => {
        if (res.data?.created?.length) {
          this.rooms.next([...res.data.created, ...this.rooms.value]);
        }
        return res.data;
      }));
  }

  updateRoom(id: string, updates: Partial<Room>): void {
    this.http.put<ApiResponse<Room>>(`${environment.apiUrl}/rooms/${id}`, updates, { headers: this.headers })
      .pipe(map(res => res.data))
      .subscribe({
        next: updated => this.rooms.next(this.rooms.value.map(r => r.id === id ? updated : r)),
        error: () => {}
      });
  }

  deleteRoom(id: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/rooms/${id}`, { headers: this.headers })
      .pipe(map(() => { this.rooms.next(this.rooms.value.filter(r => r.id !== id)); }));
  }
}
