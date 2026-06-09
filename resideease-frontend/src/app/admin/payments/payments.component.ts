import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TagModule } from 'primeng/tag';
import { Student } from '../../models/student.model';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allStudents: Student[]      = [];
  filteredStudents: Student[] = [];

  searchQuery         = '';
  filterStatus        = '';
  filterStudentStatus = '';
  sortField: 'balance' | 'total' | 'paid' | 'name' = 'balance';
  sortDir: 'asc' | 'desc' = 'desc';

  totalCollected   = 0;
  totalOutstanding = 0;
  paidCount        = 0;
  overdueCount     = 0;

  constructor(private readonly studentService: StudentService) {}

  ngOnInit(): void {
    this.studentService.getStudents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        this.allStudents = students;
        this.computeStats(students);
        this.applyFilters();
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private computeStats(students: Student[]): void {
    const active = students.filter(s => s.status === 'active' || s.status === 'pending');
    this.totalCollected   = active.reduce((sum, s) => sum + s.paidAmount, 0);
    this.totalOutstanding = active.reduce((sum, s) => sum + Math.max(0, s.totalPayment - s.paidAmount), 0);
    this.paidCount        = active.filter(s => s.paymentStatus === 'paid').length;
    this.overdueCount     = active.filter(s => s.paymentStatus === 'overdue').length;
  }

  applyFilters(): void {
    let result = [...this.allStudents];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus)        result = result.filter(s => s.paymentStatus === this.filterStatus);
    if (this.filterStudentStatus) result = result.filter(s => s.status === this.filterStudentStatus);
    this.filteredStudents = this.sortStudents(result);
  }

  private sortStudents(list: Student[]): Student[] {
    return [...list].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (this.sortField) {
        case 'balance': va = a.totalPayment - a.paidAmount; vb = b.totalPayment - b.paidAmount; break;
        case 'total':   va = a.totalPayment; vb = b.totalPayment; break;
        case 'paid':    va = a.paidAmount;   vb = b.paidAmount;   break;
        default:        va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}`; break;
      }
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }

  setSort(field: typeof this.sortField): void {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortField = field; this.sortDir = 'desc'; }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = this.filterStatus = this.filterStudentStatus = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterStatus || this.filterStudentStatus);
  }

  getBalance(s: Student): number { return s.totalPayment - s.paidAmount; }

  getCollectionPct(s: Student): number {
    return s.totalPayment > 0 ? Math.min(100, Math.round((s.paidAmount / s.totalPayment) * 100)) : 0;
  }

  getPaymentSeverity(status: string): 'success' | 'warning' | 'danger' {
    return status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'danger';
  }

  getAvatarColor(name: string): string {
    const colors = ['#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#6366f1','#14b8a6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  getSortIcon(field: typeof this.sortField): string {
    if (this.sortField !== field) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }
}
