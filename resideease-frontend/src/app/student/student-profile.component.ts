import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Student } from '../models/student.model';
import { StudentService } from '../services/student.service';
import { MessService } from '../services/mess.service';
import { MessEnrollment } from '../models/mess.model';
import { RebateService } from '../services/rebate.service';
import { RebateRequest, RebateDays } from '../models/rebate.model';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss']
})
export class StudentProfileComponent implements OnInit {
  student?: Student;
  activeTab: 'basic' | 'education' | 'hostel' | 'fees' | 'mess' | 'rebate' = 'basic';
  todayEnrollment?: MessEnrollment;
  couponGenerated = false;

  // Rebate
  selectedRebateDays: RebateDays = 10;
  rebateSubmitting = false;
  rebateSuccessMsg = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly studentService: StudentService,
    private readonly messService: MessService,
    private readonly rebateService: RebateService
  ) {}

  signOut(): void {
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.student = this.studentService.getStudentById(id);
      this.checkTodayEnrollment();
    }
  }

  checkTodayEnrollment(): void {
    if (this.student) {
      const today = new Date().toISOString().split('T')[0];
      const enrollments = this.messService.getEnrollmentsValue();
      this.todayEnrollment = enrollments.find(e =>
        e.studentId === this.student!.id &&
        e.enrollmentDate === today &&
        e.status !== 'cancelled'
      );
    }
  }

  enrollForMess(): void {
    if (this.student && !this.todayEnrollment && !this.hasApprovedRebate) {
      this.messService.enrollStudent(this.student).subscribe({
        next: enrollment => {
          this.todayEnrollment = enrollment;
          this.couponGenerated = true;
          setTimeout(() => this.couponGenerated = false, 3000);
        },
        error: () => {}
      });
    }
  }

  // ─── Rebate helpers ───────────────────────────────────────────────────

  get activeRebate(): RebateRequest | undefined {
    if (!this.student) return undefined;
    return this.rebateService.getActiveRebate(this.student.id);
  }

  get hasApprovedRebate(): boolean {
    return this.activeRebate?.status === 'approved';
  }

  get rebateDayOptions(): RebateDays[] {
    return [10, 14, 28];
  }

  selectRebateDays(days: RebateDays): void {
    this.selectedRebateDays = days;
  }

  submitRebate(): void {
    if (!this.student || this.activeRebate) return;
    this.rebateSubmitting = true;
    this.rebateService.submitRequest(
      this.student.id,
      `${this.student.firstName} ${this.student.lastName}`,
      this.student.rollNumber,
      this.selectedRebateDays
    );
    this.rebateSubmitting = false;
    this.rebateSuccessMsg = 'Rebate request submitted successfully!';
    setTimeout(() => (this.rebateSuccessMsg = ''), 3000);
  }

  cancelRebate(): void {
    const rebate = this.activeRebate;
    if (rebate) {
      this.rebateService.cancelRequest(rebate.id);
    }
  }

  // ─── Fee helpers ──────────────────────────────────────────────────────

  get feeStatus(): 'paid' | 'pending' | 'overdue' {
    if (!this.student) return 'pending';
    if (this.student.status === 'active') return 'paid';
    if (this.student.status === 'inactive') return 'overdue';
    return 'pending';
  }

  get feeStatusLabel(): string {
    return { paid: 'Paid', pending: 'Pending', overdue: 'Overdue' }[this.feeStatus];
  }

  get feeStatusBadgeClass(): string {
    return { paid: 'badge--green', pending: 'badge--amber', overdue: 'badge--danger' }[this.feeStatus];
  }

  get residencyFeePaid(): string {
    if (!this.student) return 'Unknown';
    return this.student.status === 'active' ? 'Yes' : 'No';
  }

  get otherCharges(): number {
    if (!this.student) return 0;
    return this.student.maintenanceCharge + this.student.securityDeposit;
  }

  get avatarColor(): string {
    if (!this.student) return '#0ab4a8';
    const palette = ['#0ab4a8','#3b82f6','#8b5cf6','#ec4899','#f97316','#10b981','#06b6d4','#ef4444'];
    return palette[(this.student.firstName.codePointAt(0) ?? 0) % palette.length];
  }
}
