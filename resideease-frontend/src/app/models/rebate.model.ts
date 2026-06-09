export type RebateDays = 10 | 14 | 28;
export type RebateStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RebateRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  days: RebateDays;
  status: RebateStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
