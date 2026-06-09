export interface HostelSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  totalRooms: number;
  establishedYear: number;
  affiliation: string;
  wardenName: string;
  wardenPhone: string;
}

export interface RoomSettings {
  id: string;
  label: string;
  price: number;
  securityDeposit: number;
  enabled: boolean;
}

export interface MealSettings {
  id: string;
  label: string;
  price: number;
  enabled: boolean;
}

export interface PolicySettings {
  checkInTime: string;
  checkOutTime: string;
  visitingHoursFrom: string;
  visitingHoursTo: string;
  lateFeePercent: number;
  gracePeriodDays: number;
  noticeBeforeCheckout: number;
  guestMaxNights: number;
}

export interface SystemSettings {
  allowOnlineBooking: boolean;
  requireApproval: boolean;
  maintenanceMode: boolean;
  notificationsEnabled: boolean;
  smsNotifications: boolean;
  autoReminderDays: number;
  academicYear: string;
  maintenanceCharge: number;
}

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  designation: string;
}

export interface AppSettings {
  hostel: HostelSettings;
  rooms: RoomSettings[];
  meals: MealSettings[];
  dietaryOptions: string[];
  policies: PolicySettings;
  system: SystemSettings;
  guestFee: number;
  admin: AdminProfile;
}
