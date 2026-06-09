import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface DashboardKpis {
  totalBeds: number;
  occupied: number;
  vacant: number;
  pendingDuesCount: number;
  pendingDuesAmount: number;
}

export interface DashboardQuickStats {
  totalResidents: number;
  newThisMonth: number;
  totalRevenue: number;
  messAttendancePct: number;
  openMaintenance: number;
  urgentMaintenance: number;
}

export interface DashboardPerson {
  id: string;
  name: string;
  room: string;
  avatar: string;
}

export interface DashboardStudent {
  id: string;
  name: string;
  room: string;
  plan: string;
  status: string;
  paymentStatus: string;
  avatar: string;
}

export interface DashboardRoomOccupancy {
  type: string;
  total: number;
  totalCapacity: number;
  occupied: number;
  pct: number;
}

export interface DashboardMessToday {
  totalStudents: number;
  lunch: number;
  dinner: number;
}

export interface DashboardStats {
  kpis: DashboardKpis;
  quickStats: DashboardQuickStats;
  todayCheckOuts: DashboardPerson[];
  todayCheckIns: DashboardPerson[];
  upcomingThisWeek: number;
  recentStudents: DashboardStudent[];
  roomOccupancy: DashboardRoomOccupancy[];
  overallOccupancyPct: number;
  messToday: DashboardMessToday;
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getStats(): Observable<DashboardStats> {
    return this.http
      .get<ApiResponse<DashboardStats>>(`${environment.apiUrl}/dashboard`, { headers: this.headers })
      .pipe(map(res => res.data));
  }
}
