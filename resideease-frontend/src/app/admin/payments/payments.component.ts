import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Student } from '../../models/student.model';
import { PaymentTransaction, PAYMENT_METHODS } from '../../models/payment.model';
import { StudentService } from '../../services/student.service';
import { PaymentService } from '../../services/payment.service';
import { DropdownComponent, DropdownOption } from '../../components/resuable/dropdown/dropdown.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allStudents:      Student[]      = [];
  filteredStudents: Student[]      = [];

  searchQuery         = '';
  filterStatus        = '';
  filterStudentStatus = '';
  sortField: 'balance' | 'total' | 'paid' | 'name' = 'balance';
  sortDir:   'asc' | 'desc' = 'desc';

  totalCollected   = 0;
  totalOutstanding = 0;
  paidCount        = 0;
  overdueCount     = 0;

  // ── Record Payment drawer ──────────────────────────────
  drawerOpen    = false;
  drawerStudent: Student | null = null;
  drawerLoading = false;
  drawerError   = '';
  drawerAmount  = 0;
  drawerMethod  = 'cash';
  drawerNotes   = '';
  drawerDate    = '';
  readonly paymentMethods = PAYMENT_METHODS;

  readonly paymentStatusOptions: DropdownOption[] = [
    { label: 'All Payment Status', value: '' },
    { label: 'Paid',               value: 'paid' },
    { label: 'Partial',            value: 'partial' },
    { label: 'Overdue',            value: 'overdue' },
  ];

  readonly boarderStatusOptions: DropdownOption[] = [
    { label: 'All Boarders',  value: '' },
    { label: 'Active',        value: 'active' },
    { label: 'Pending',       value: 'pending' },
    { label: 'Expired',       value: 'expired' },
    { label: 'Checked Out',   value: 'checked_out' },
  ];

  readonly methodOptions: DropdownOption[] = PAYMENT_METHODS.map(m => ({ label: m.label, value: m.value }));

  // ── Payment History modal ──────────────────────────────
  historyOpen    = false;
  historyStudent: Student | null = null;
  historyTx:      PaymentTransaction[] = [];
  historyLoading = false;

  // ── Toast ─────────────────────────────────────────────
  toastMsg  = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly studentService: StudentService,
    private readonly paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.studentService.getStudents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        this.allStudents = students;
        this.computeStats(students);
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ── Stats ─────────────────────────────────────────────
  private computeStats(students: Student[]): void {
    this.totalCollected   = students.reduce((sum, s) => sum + (s.paidAmount   ?? 0), 0);
    this.totalOutstanding = students.reduce((sum, s) => sum + Math.max(0, (s.totalPayment ?? 0) - (s.paidAmount ?? 0)), 0);
    this.paidCount        = students.filter(s => s.paymentStatus === 'paid').length;
    this.overdueCount     = students.filter(s => s.paymentStatus === 'overdue').length;
  }

  // ── Filters / Sort ────────────────────────────────────
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
    if (this.filterStudentStatus) result = result.filter(s => s.status        === this.filterStudentStatus);
    this.filteredStudents = this.sortStudents(result);
  }

  private sortStudents(list: Student[]): Student[] {
    return [...list].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (this.sortField) {
        case 'balance': va = (a.totalPayment ?? 0) - (a.paidAmount ?? 0); vb = (b.totalPayment ?? 0) - (b.paidAmount ?? 0); break;
        case 'total':   va = a.totalPayment  ?? 0; vb = b.totalPayment  ?? 0; break;
        case 'paid':    va = a.paidAmount    ?? 0; vb = b.paidAmount    ?? 0; break;
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

  // ── Derived ───────────────────────────────────────────
  getBalance(s: Student): number {
    return Math.max(0, (s.totalPayment ?? 0) - (s.paidAmount ?? 0));
  }

  getCollectionPct(s: Student): number {
    const total = s.totalPayment ?? 0;
    const paid  = s.paidAmount  ?? 0;
    return total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  }

  getStatusLabel(status: string): string {
    return { paid: 'Paid', partial: 'Partial', overdue: 'Overdue', unpaid: 'Unpaid' }[status] ?? status;
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

  // ── Record Payment drawer ──────────────────────────────
  openDrawer(student: Student): void {
    this.drawerStudent = student;
    this.drawerAmount  = 0;
    this.drawerMethod  = 'cash';
    this.drawerNotes   = '';
    this.drawerDate    = new Date().toISOString().split('T')[0];
    this.drawerError   = '';
    this.drawerOpen    = true;
  }

  closeDrawer(): void { this.drawerOpen = false; this.drawerStudent = null; }

  get drawerBalance(): number {
    return this.drawerStudent ? this.getBalance(this.drawerStudent) : 0;
  }

  // null-safe wrappers used in template
  paidOf(s: Student):  number { return s.paidAmount   ?? 0; }
  totalOf(s: Student): number { return s.totalPayment ?? 0; }

  submitPayment(): void {
    if (!this.drawerStudent) return;
    if (!this.drawerAmount || this.drawerAmount <= 0) {
      this.drawerError = 'Enter a valid amount greater than zero.';
      return;
    }
    this.drawerError   = '';
    this.drawerLoading = true;

    this.paymentService.record({
      studentId: this.drawerStudent.id,
      amount:    this.drawerAmount,
      method:    this.drawerMethod,
      notes:     this.drawerNotes || undefined,
      paidAt:    this.drawerDate,
    }).subscribe({
      next: ({ student }) => {
        this.drawerLoading = false;
        this.closeDrawer();
        // Update the local student record with new paid/status values
        const idx = this.allStudents.findIndex(s => s.id === student.id);
        if (idx !== -1) {
          this.allStudents[idx] = { ...this.allStudents[idx], ...student };
          this.computeStats(this.allStudents);
          this.applyFilters();
        }
        this.showToast('Payment recorded successfully.', 'success');
      },
      error: () => {
        this.drawerLoading = false;
        this.drawerError   = 'Failed to record payment. Please try again.';
      },
    });
  }

  // ── Payment History modal ──────────────────────────────
  openHistory(student: Student): void {
    this.historyStudent = student;
    this.historyTx      = [];
    this.historyLoading = true;
    this.historyOpen    = true;
    this.paymentService.getByStudent(student.id).subscribe({
      next:  txs => { this.historyTx = txs; this.historyLoading = false; },
      error: ()  => { this.historyLoading = false; },
    });
  }

  closeHistory(): void { this.historyOpen = false; this.historyStudent = null; }

  methodLabel(method: string): string {
    return PAYMENT_METHODS.find(m => m.value === method)?.label ?? method;
  }

  // ── Toast ─────────────────────────────────────────────
  private showToast(msg: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg  = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMsg = ''), 4000);
  }
}
