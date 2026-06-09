export type MaintenanceCategory = 'plumbing' | 'electrical' | 'carpentry' | 'cleaning' | 'appliance' | 'other';
export type MaintenanceStatus   = 'open' | 'in-progress' | 'resolved' | 'closed';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceRequest {
  id: string;
  ticketNumber: string;
  studentName: string;
  rollNumber: string;
  roomNumber: string;
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  raisedAt: string;
  resolvedAt?: string;
}
