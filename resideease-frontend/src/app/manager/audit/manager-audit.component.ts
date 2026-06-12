import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StudentService } from '../../services/student.service';
import { RebateService } from '../../services/rebate.service';
import { SupplierBillService } from '../../services/supplier-bill.service';
import { MessService } from '../../services/mess.service';
import { AuditHistoryService, PublishedAudit } from '../../services/audit-history.service';
import { StudentNotificationService } from '../../services/student-notification.service';
import { MasterDataService } from '../../services/master-data.service';
import { Student } from '../../models/student.model';
import { RebateRequest } from '../../models/rebate.model';
import { SupplierBill } from '../../models/supplier-bill.model';
import { DropdownComponent, DropdownOption } from '../../components/resuable/dropdown/dropdown.component';

interface AuditStudentRow {
  studentId:    string;
  studentName:  string;
  rollNumber:   string;
  rebateDays:   number;
  billableDays: number;
  billAmount:   number;
}

interface AuditResult {
  month:             number;
  year:              number;
  daysInMonth:       number;
  totalSupplierBill: number;
  totalBillableDays: number;
  perDayRate:        number;
  billCount:         number;
  studentCount:      number;
  rebatedCount:      number;
  rows:              AuditStudentRow[];
  totalStudentBill:  number;
}

@Component({
  selector: 'app-manager-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './manager-audit.component.html',
  styleUrl: './manager-audit.component.scss'
})
export class ManagerAuditComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  selectedMonth: number;
  selectedYear:  number;

  readonly months = [
    { value: 1,  label: 'January'   },
    { value: 2,  label: 'February'  },
    { value: 3,  label: 'March'     },
    { value: 4,  label: 'April'     },
    { value: 5,  label: 'May'       },
    { value: 6,  label: 'June'      },
    { value: 7,  label: 'July'      },
    { value: 8,  label: 'August'    },
    { value: 9,  label: 'September' },
    { value: 10, label: 'October'   },
    { value: 11, label: 'November'  },
    { value: 12, label: 'December'  },
  ];

  readonly monthOptions: DropdownOption[] = [];
  readonly yearOptions: DropdownOption[] = [];
  readonly years: number[] = [];

  private allStudents: Student[]       = [];
  private allRebates:  RebateRequest[] = [];
  private allBills:    SupplierBill[]  = [];

  result:         AuditResult | null  = null;
  publishedAudit: PublishedAudit | null = null;
  hasRun = false;

  // Confirmation dialog
  showConfirm = false;

  // Toast
  toastMsg  = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly studentService:  StudentService,
    private readonly rebateService:   RebateService,
    private readonly billService:     SupplierBillService,
    private readonly messService:     MessService,
    private readonly auditHistory:    AuditHistoryService,
    private readonly studentNotifs:   StudentNotificationService,
    private readonly masterData:      MasterDataService,
  ) {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear  = now.getFullYear();
    for (let y = now.getFullYear(); y >= 2023; y--) this.years.push(y);
    this.monthOptions = this.masterData.getMonthOptions();
    this.yearOptions  = this.masterData.getYearOptions(2023, now.getFullYear());
  }

  ngOnInit(): void {
    this.studentService.getStudents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(s => this.allStudents = s);

    this.rebateService.getRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe(r => this.allRebates = r);

    this.billService.getBills()
      .pipe(takeUntil(this.destroy$))
      .subscribe(b => this.allBills = b);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  runAudit(): void {
    const { selectedMonth: m, selectedYear: y } = this;
    const daysInMonth = new Date(y, m, 0).getDate();

    const monthBills = this.allBills.filter(b => {
      const d = new Date(b.billDate);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
    const totalSupplierBill = monthBills.reduce((sum, b) => sum + b.amount, 0);

    const rebateMap = new Map<string, number>();
    this.allRebates
      .filter(r => {
        if (r.status !== 'approved') return false;
        const d = new Date(r.requestedAt);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      })
      .forEach(r => {
        const prev = rebateMap.get(r.studentId) ?? 0;
        rebateMap.set(r.studentId, Math.min(prev + r.days, daysInMonth));
      });

    const activeStudents = this.allStudents.filter(s => s.status === 'active');
    const rowsWithDays = activeStudents.map(s => ({
      studentId:    s.id,
      studentName:  `${s.firstName} ${s.lastName}`,
      rollNumber:   s.rollNumber,
      rebateDays:   rebateMap.get(s.id) ?? 0,
      billableDays: daysInMonth - (rebateMap.get(s.id) ?? 0),
    }));

    const totalBillableDays = rowsWithDays.reduce((sum, r) => sum + r.billableDays, 0);
    const perDayRate = totalBillableDays > 0 ? totalSupplierBill / totalBillableDays : 0;

    const rows: AuditStudentRow[] = rowsWithDays
      .map(r => ({ ...r, billAmount: perDayRate * r.billableDays }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));

    this.result = {
      month: m, year: y,
      daysInMonth, totalSupplierBill, totalBillableDays, perDayRate,
      billCount:    monthBills.length,
      studentCount: activeStudents.length,
      rebatedCount: rebateMap.size,
      rows,
      totalStudentBill: rows.reduce((sum, r) => sum + r.billAmount, 0),
    };

    this.publishedAudit = this.auditHistory.getForMonth(m, y) ?? null;
    this.hasRun = true;
  }

  // ── Publish ──────────────────────────────────────────────────────────────

  openConfirm(): void {
    this.showConfirm = true;
  }

  cancelConfirm(): void {
    this.showConfirm = false;
  }

  confirmPublish(): void {
    this.showConfirm = false;
    if (!this.result) return;

    const { month, year, daysInMonth, totalSupplierBill, totalBillableDays,
            perDayRate, studentCount, rebatedCount, totalStudentBill, rows } = this.result;

    // Save to audit history
    this.auditHistory.publish({
      month, year, daysInMonth, totalSupplierBill, totalBillableDays,
      perDayRate, studentCount, rebatedCount, totalStudentBill, rows,
    }).subscribe({
      next: published => {
        this.publishedAudit = published;

        // Notify each student
        this.studentNotifs.addMany(rows.map(r => ({
          studentId: r.studentId,
          type:      'bill' as const,
          title:     `Mess Bill — ${this.monthLabel} ${year}`,
          message:   `Your mess bill for ${this.monthLabel} ${year} is INR ${r.billAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${r.billableDays} billable days${r.rebateDays > 0 ? `, rebate: ${r.rebateDays} days` : ''}).`,
        })));

        // Notify office via manager bell
        this.messService.addAuditPublishedNotification(
          this.monthLabel, year, totalStudentBill, perDayRate, studentCount
        );

        this.showToast(`Audit published — ${studentCount} students notified.`, 'success');
      },
      error: () => this.showToast('Failed to publish audit. Please try again.', 'error'),
    });
  }

  // ── Export CSV ───────────────────────────────────────────────────────────

  exportCsv(): void {
    if (!this.result) return;
    const { month, year, daysInMonth, perDayRate, rows, totalStudentBill, totalSupplierBill } = this.result;
    const pad = (n: number) => String(n).padStart(2, '0');

    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

    const lines: string[] = [
      `"Billing Audit — ${this.monthLabel} ${year}"`,
      `"Generated: ${new Date().toLocaleString()}"`,
      '',
      ['Boarder Name', 'Roll Number', 'Days in Month', 'Rebate Days',
       'Billable Days', 'Per Day Rate (INR)', 'Bill Amount (INR)']
        .map(escape).join(','),
      ...rows.map(r =>
        [r.studentName, r.rollNumber, daysInMonth, r.rebateDays,
         r.billableDays, perDayRate.toFixed(2), r.billAmount.toFixed(2)]
          .map(escape).join(',')
      ),
      '',
      `"","","","","Total Supplier Bill","",${escape(totalSupplierBill.toFixed(2))}`,
      `"","","","","Total Boarder Bills","",${escape(totalStudentBill.toFixed(2))}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `audit-${year}-${pad(month)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  get monthLabel(): string {
    return this.months.find(mo => mo.value === this.selectedMonth)?.label ?? '';
  }

  get isAlreadyPublished(): boolean {
    return !!this.publishedAudit;
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg  = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMsg = ''), 4000);
  }
}
