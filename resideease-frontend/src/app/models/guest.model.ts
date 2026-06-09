export interface GuestRegistration {
  id: string;
  fullName: string;
  phone: string;
  aadhaarNumber: string;
  registeredAt: string;
  feePaid: boolean;
  feeAmount: number;
  receiptNumber: string;
  status: 'pending_otp' | 'otp_verified' | 'paid';
}
