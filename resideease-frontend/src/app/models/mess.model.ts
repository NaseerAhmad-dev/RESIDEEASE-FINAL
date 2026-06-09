export interface MessEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  couponNumber: string;
  enrollmentDate: string; // YYYY-MM-DD format
  mealType: 'lunch' | 'dinner' | 'both';
  status: 'enrolled' | 'served' | 'cancelled';
  servedAt?: string; // timestamp when meal was served
  servedBy?: string; // manager who served the meal
  createdAt: string;
}

export interface MessNotification {
  id: string;
  type: 'new_student' | 'timing' | 'announcement' | 'maintenance' | 'audit';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface MessStats {
  totalSubscribed: number;
  totalServed: number;
  pendingStudents: number;
  todayDate: string;
}