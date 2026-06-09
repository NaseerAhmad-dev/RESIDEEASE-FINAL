import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppSettings, HostelSettings, RoomSettings, MealSettings, SystemSettings, PolicySettings, AdminProfile } from '../models/settings.model';
import { ROOM_OPTIONS, MEAL_PLANS, DIETARY_OPTIONS } from '../models/onboarding.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

const DEFAULT: AppSettings = {
  hostel: {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    totalRooms: 0,
    establishedYear: new Date().getFullYear(),
    affiliation: '',
    wardenName: '',
    wardenPhone: '',
  },
  rooms: ROOM_OPTIONS.map(r => ({ id: r.id, label: r.label, price: r.price, securityDeposit: r.price * 2, enabled: true })),
  meals: MEAL_PLANS.map(m => ({ id: m.id, label: m.label, price: m.price, enabled: true })),
  dietaryOptions: [...DIETARY_OPTIONS],
  policies: {
    checkInTime: '10:00', checkOutTime: '10:00',
    visitingHoursFrom: '06:00', visitingHoursTo: '21:00',
    lateFeePercent: 2, gracePeriodDays: 5,
    noticeBeforeCheckout: 30, guestMaxNights: 2,
  },
  system: {
    allowOnlineBooking: true, requireApproval: true,
    maintenanceMode: false, notificationsEnabled: true,
    smsNotifications: false, autoReminderDays: 7,
    academicYear: '2025-26', maintenanceCharge: 500,
  },
  guestFee: 200,
  admin: { name: '', email: '', phone: '', designation: '' },
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly settings = signal<AppSettings>(DEFAULT);

  constructor() {
    this.loadSettings();
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getSettings() { return this.settings.asReadonly(); }

  loadSettings(): void {
    this.http.get<ApiResponse<any>>(`${environment.apiUrl}/settings`, { headers: this.headers })
      .subscribe({
        next: res => {
          const s = res.data;
          this.settings.update(cur => ({
            hostel:         { ...cur.hostel,   ...(s.hostel  ?? {}) },
            rooms:          s.rooms          ?? cur.rooms,
            meals:          s.meals          ?? cur.meals,
            dietaryOptions: s.dietaryOptions ?? cur.dietaryOptions,
            policies:       { ...cur.policies, ...(s.hostel?.policies ?? {}) },
            system:         { ...cur.system,   ...(s.system  ?? {}) },
            guestFee:       s.guestFee       ?? cur.guestFee,
            admin:          { ...cur.admin,    ...(s.hostel?.admin    ?? {}) },
          }));
        },
        error: () => {}
      });
  }

  saveSettings(): Promise<void> {
    const s = this.settings();
    const payload = {
      hostel:         { ...s.hostel, policies: s.policies, admin: s.admin },
      rooms:          s.rooms,
      meals:          s.meals,
      dietaryOptions: s.dietaryOptions,
      system:         s.system,
      guestFee:       s.guestFee,
    };
    return new Promise(resolve => {
      this.http.put<ApiResponse<any>>(`${environment.apiUrl}/settings`, payload, { headers: this.headers })
        .subscribe({ next: () => resolve(), error: () => resolve() });
    });
  }

  updateHostelSettings(updates: Partial<HostelSettings>): void {
    this.settings.update(cur => ({ ...cur, hostel: { ...cur.hostel, ...updates } }));
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/settings/hostel`, { ...this.settings().hostel }, { headers: this.headers })
      .subscribe({ error: () => {} });
  }

  updateRoomSettings(roomId: string, updates: Partial<RoomSettings>): void {
    this.settings.update(cur => ({ ...cur, rooms: cur.rooms.map(r => r.id === roomId ? { ...r, ...updates } : r) }));
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/settings/rooms/${roomId}`, updates, { headers: this.headers })
      .subscribe({ error: () => {} });
  }

  updateMealSettings(mealId: string, updates: Partial<MealSettings>): void {
    this.settings.update(cur => ({ ...cur, meals: cur.meals.map(m => m.id === mealId ? { ...m, ...updates } : m) }));
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/settings/meals/${mealId}`, updates, { headers: this.headers })
      .subscribe({ error: () => {} });
  }

  updateDietaryOptions(options: string[]): void {
    this.settings.update(cur => ({ ...cur, dietaryOptions: [...options] }));
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/settings`, { dietaryOptions: options }, { headers: this.headers })
      .subscribe({ error: () => {} });
  }

  updateSystemSettings(updates: Partial<SystemSettings>): void {
    this.settings.update(cur => ({ ...cur, system: { ...cur.system, ...updates } }));
    this.http.put<ApiResponse<any>>(`${environment.apiUrl}/settings/system`, updates, { headers: this.headers })
      .subscribe({ error: () => {} });
  }

  updatePolicySettings(updates: Partial<PolicySettings>): void {
    this.settings.update(cur => ({ ...cur, policies: { ...cur.policies, ...updates } }));
  }

  updateAdminProfile(updates: Partial<AdminProfile>): void {
    this.settings.update(cur => ({ ...cur, admin: { ...cur.admin, ...updates } }));
  }
}
