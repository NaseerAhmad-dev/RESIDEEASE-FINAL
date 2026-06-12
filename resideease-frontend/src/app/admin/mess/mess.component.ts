import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../components/resuable/dropdown/dropdown.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { Student } from '../../models/student.model';
import { MessNotification } from '../../models/mess.model';
import { StudentService } from '../../services/student.service';
import { MessService } from '../../services/mess.service';

@Component({
  selector: 'app-mess',
  standalone: true,
  imports: [CommonModule, FormsModule, TabViewModule, TagModule, DropdownComponent],
  templateUrl: './mess.component.html',
  styleUrl: './mess.component.scss'
})
export class MessComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allSubscribers: Student[] = [];
  filteredSubscribers: Student[] = [];
  notifications: MessNotification[] = [];

  searchQuery    = '';
  filterPayment  = '';

  readonly paymentFilterOptions: DropdownOption[] = [
    { label: 'All Payment Status', value: ''        },
    { label: 'Paid',               value: 'paid'    },
    { label: 'Partial',            value: 'partial' },
    { label: 'Overdue',            value: 'overdue' },
  ];

  readonly announcementPriorityOptions: DropdownOption[] = [
    { label: 'Low',    value: 'low'    },
    { label: 'Medium', value: 'medium' },
    { label: 'High',   value: 'high'   },
  ];

  totalSubscribers = 0;
  monthlyRevenue   = 0;
  overdueCount     = 0;
  newThisMonth     = 0;

  announcementTitle    = '';
  announcementMessage  = '';
  announcementPriority: 'low' | 'medium' | 'high' = 'medium';
  postSuccess = false;

  constructor(
    private readonly studentService: StudentService,
    private readonly messService: MessService
  ) {}

  ngOnInit(): void {
    this.studentService.getStudents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        this.allSubscribers = students.filter(s =>
          s.messFee > 0 && (s.status === 'active' || s.status === 'pending')
        );
        this.computeStats();
        this.applyFilters();
      });

    this.messService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => { this.notifications = n; });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private computeStats(): void {
    this.totalSubscribers = this.allSubscribers.length;
    this.monthlyRevenue   = this.allSubscribers.reduce((sum, s) => sum + s.messFee, 0);
    this.overdueCount     = this.allSubscribers.filter(s => s.paymentStatus === 'overdue').length;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    this.newThisMonth = this.allSubscribers.filter(s => new Date(s.createdAt) >= cutoff).length;
  }

  applyFilters(): void {
    let result = [...this.allSubscribers];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
      );
    }
    if (this.filterPayment) result = result.filter(s => s.paymentStatus === this.filterPayment);
    this.filteredSubscribers = result;
  }

  clearFilters(): void {
    this.searchQuery = this.filterPayment = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean { return !!(this.searchQuery || this.filterPayment); }
  get unreadCount(): number { return this.notifications.filter(n => !n.isRead).length; }

  postAnnouncement(): void {
    if (!this.announcementTitle.trim() || !this.announcementMessage.trim()) return;
    this.messService.addAnnouncement(
      this.announcementTitle.trim(),
      this.announcementMessage.trim(),
      this.announcementPriority
    );
    this.announcementTitle = this.announcementMessage = '';
    this.announcementPriority = 'medium';
    this.postSuccess = true;
    setTimeout(() => { this.postSuccess = false; }, 3000);
  }

  markRead(id: string): void { this.messService.markNotificationAsRead(id); }

  getAvatarColor(name: string): string {
    const colors = ['#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#6366f1','#14b8a6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  getPaymentSeverity(status: string): 'success' | 'warning' | 'danger' {
    return status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'danger';
  }

  getNotifTypeLabel(type: string): string {
    return { announcement: 'Announcement', timing: 'Timing', maintenance: 'Maintenance', new_student: 'New Student' }[type] ?? type;
  }

  getNotifTypeClass(type: string): string {
    return { announcement: 'type-announcement', timing: 'type-timing', maintenance: 'type-maintenance', new_student: 'type-student' }[type] ?? '';
  }

  getPriorityClass(priority: string): string {
    return { high: 'pri-high', medium: 'pri-medium', low: 'pri-low' }[priority] ?? '';
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60)   return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)   return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
