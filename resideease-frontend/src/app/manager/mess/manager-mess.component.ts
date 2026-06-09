import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MessService } from '../../services/mess.service';
import { MessEnrollment } from '../../models/mess.model';

@Component({
  selector: 'app-manager-mess',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-mess.component.html',
  styleUrl: './manager-mess.component.scss'
})
export class ManagerMessComponent implements OnInit, OnDestroy {
  private readonly messService = inject(MessService);

  statusFilter: 'all' | 'enrolled' | 'served' = 'all';

  allEnrollments: MessEnrollment[] = [];

  stats = { totalEnrolled: 0, served: 0, pending: 0 };
  today = new Date();

  couponInput = '';
  couponResult: 'idle' | 'success' | 'error' | 'already-served' = 'idle';
  couponMessage = '';

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadData();
    this.subs.push(
      this.messService.getEnrollments().subscribe(() => this.loadData())
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  loadData(): void {
    this.allEnrollments = this.messService.getTodayEnrollments();
    const s = this.messService.getTodayStats();
    this.stats = { totalEnrolled: s.totalSubscribed, served: s.totalServed, pending: s.pendingStudents };
  }

  get filteredEnrollments(): MessEnrollment[] {
    if (this.statusFilter === 'all') return this.allEnrollments;
    return this.allEnrollments.filter(e => e.status === this.statusFilter);
  }

  get pendingList(): MessEnrollment[] {
    return this.allEnrollments.filter(e => e.status === 'enrolled');
  }

  get completionRate(): number {
    if (this.stats.totalEnrolled === 0) return 0;
    return Math.round((this.stats.served / this.stats.totalEnrolled) * 100);
  }

  setFilter(f: 'all' | 'enrolled' | 'served'): void {
    this.statusFilter = f;
  }

  validateCoupon(): void {
    const coupon = this.couponInput.trim().toUpperCase();
    if (!coupon) {
      this.couponResult = 'error';
      this.couponMessage = 'Please enter a coupon number.';
      return;
    }
    const existing = this.messService.getEnrollmentByCoupon(coupon);
    if (existing?.status === 'served') {
      this.couponResult = 'already-served';
      this.couponMessage = `Already served — ${existing.studentName} collected their meal at ${this.formatTime(existing.servedAt)}.`;
      return;
    }
    this.messService.validateAndServeCoupon(coupon).subscribe({
      next: enrollment => {
        if (enrollment) {
          this.couponResult = 'success';
          this.couponMessage = `Meal served to ${enrollment.studentName} (${this.mealLabel(enrollment.mealType ?? '')}).`;
          this.couponInput = '';
          setTimeout(() => { this.couponResult = 'idle'; this.couponMessage = ''; }, 4000);
        } else {
          this.couponResult = 'error';
          this.couponMessage = 'Invalid coupon. It may not exist or may be from a different date.';
        }
      },
      error: () => {
        this.couponResult = 'error';
        this.couponMessage = 'Invalid coupon. It may not exist or may be from a different date.';
      }
    });
  }

  serveMeal(coupon: string): void {
    this.messService.validateAndServeCoupon(coupon).subscribe();
  }

  mealLabel(type: string): string {
    return ({ lunch: 'Lunch', dinner: 'Dinner', both: 'Lunch & Dinner' } as Record<string, string>)[type] ?? type;
  }

  formatTime(ts?: string): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
