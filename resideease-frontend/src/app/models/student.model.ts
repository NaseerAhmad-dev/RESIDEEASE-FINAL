export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rollNumber: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not';
  department?: string;
  checkInDate: string;
  roomNumber?: string;
  currentSemester: string;
  residenceExpiry: string;
  selectedRoom: string;
  roomPrice: number;
  residencyAccount: 'university' | 'residency';
  maintenanceCharge: number;
  securityDeposit: number;
  messFee: number;
  totalPayment: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'overdue';
  lastPaymentDate?: string;
  profilePicture?: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'pending' | 'expired' | 'checked_out';
}