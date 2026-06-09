import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface HostelLocation {
  id: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city:         string | null;
  state:        string | null;
  pincode:      string | null;
  country:      string;
  latitude:     number | null;
  longitude:    number | null;
}

export interface HostelOwner {
  id:        string;
  name:      string;
  email:     string | null;
  phone:     string | null;
  altPhone:  string | null;
  isPrimary: boolean;
}

export interface HostelSettings {
  id:               string;
  totalSeats:       number | null;
  totalRooms:       number | null;
  hasMess:          boolean;
  messType:         string | null;
  noticePeriodDays: number;
  logoUrl:          string | null;
  website:          string | null;
  description:      string | null;
  timezone:         string;
}

export interface HostelStaffUser {
  id:       string;
  name:     string | null;
  email:    string | null;
  username: string | null;
  role:     { name: string };
}

export interface HostelSubscription {
  id:           string;
  planName:     string;
  planId:       string | null;
  status:       string;
  billingCycle: string | null;
  seatLimit:    number | null;
  staffLimit:   number | null;
  startsAt:     string;
  endsAt:       string | null;
  trialEndsAt:  string | null;
  graceEndsAt:  string | null;
  isCurrent:    boolean;
}

export interface HostelPayment {
  id:             string;
  hostelId:       string;
  subscriptionId: string | null;
  amount:         number;
  currency:       string;
  status:         string;
  paymentMethod:  string | null;
  paidAt:         string | null;
  invoiceUrl:     string | null;
  createdAt:      string;
}

export interface UpsertSubscriptionPayload {
  planName:     string;
  planId?:      string | null;
  status?:      string;
  billingCycle?: string | null;
  seatLimit?:   number | null;
  staffLimit?:  number | null;
  startsAt?:    string;
  endsAt?:      string | null;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
}

export interface RecordPaymentPayload {
  amount:         number;
  currency?:      string;
  paymentMethod?: string | null;
  status?:        string;
  paidAt?:        string | null;
  invoiceUrl?:    string | null;
  subscriptionId?: string | null;
}

export interface Hostel {
  id:         string;
  name:       string;
  slug:       string;
  code:       string;
  hostelType: string;
  isActive:   boolean;
  isReadOnly: boolean;
  createdAt:  string;
  updatedAt:  string;
  deletedAt:  string | null;
  location:      HostelLocation | null;
  owners:        HostelOwner[];
  settings:      HostelSettings | null;
  subscriptions: HostelSubscription[];
  users:         HostelStaffUser[];
}

export interface CreateHostelPayload {
  name:       string;
  hostelType?: string;
  location?: {
    addressLine1?: string;
    city?:         string;
    state?:        string;
    pincode?:      string;
    latitude?:     number | null;
    longitude?:    number | null;
  };
  owner?: {
    name?:  string;
    email?: string;
    phone?: string;
  };
  settings?: {
    totalSeats?:  number | null;
    totalRooms?:  number | null;
    hasMess?:     boolean;
    messType?:    string;
    website?:     string;
    description?: string;
  };
  adminEmail:     string;
  adminPassword:  string;
  adminName?:     string;
}

export interface UpdateHostelPayload {
  name?:       string;
  hostelType?: string;
  isActive?:   boolean;
  location?: {
    addressLine1?: string;
    city?:         string;
    state?:        string;
    pincode?:      string;
    latitude?:     number | null;
    longitude?:    number | null;
  };
  settings?: {
    totalSeats?:  number | null;
    totalRooms?:  number | null;
    hasMess?:     boolean;
    messType?:    string;
    website?:     string;
    description?: string;
  };
}

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class HostelService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  listHostels(): Observable<ApiResponse<Hostel[]>> {
    return this.http.get<ApiResponse<Hostel[]>>(`${environment.apiUrl}/hostels`, { headers: this.headers });
  }

  getHostel(id: string): Observable<ApiResponse<Hostel>> {
    return this.http.get<ApiResponse<Hostel>>(`${environment.apiUrl}/hostels/${id}`, { headers: this.headers });
  }

  createHostel(payload: CreateHostelPayload): Observable<ApiResponse<Hostel>> {
    return this.http.post<ApiResponse<Hostel>>(`${environment.apiUrl}/hostels`, payload, { headers: this.headers });
  }

  updateHostel(id: string, payload: UpdateHostelPayload): Observable<ApiResponse<Hostel>> {
    return this.http.put<ApiResponse<Hostel>>(`${environment.apiUrl}/hostels/${id}`, payload, { headers: this.headers });
  }

  deleteHostel(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/hostels/${id}`, { headers: this.headers });
  }

  upsertSubscription(hostelId: string, payload: UpsertSubscriptionPayload): Observable<ApiResponse<HostelSubscription>> {
    return this.http.put<ApiResponse<HostelSubscription>>(`${environment.apiUrl}/hostels/${hostelId}/subscription`, payload, { headers: this.headers });
  }

  listPayments(hostelId: string): Observable<ApiResponse<HostelPayment[]>> {
    return this.http.get<ApiResponse<HostelPayment[]>>(`${environment.apiUrl}/hostels/${hostelId}/payments`, { headers: this.headers });
  }

  recordPayment(hostelId: string, payload: RecordPaymentPayload): Observable<ApiResponse<HostelPayment>> {
    return this.http.post<ApiResponse<HostelPayment>>(`${environment.apiUrl}/hostels/${hostelId}/payments`, payload, { headers: this.headers });
  }
}
