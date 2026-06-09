import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  HostelService, Hostel, HostelStaffUser, HostelPayment,
} from '../../services/hostel.service';
import { AuthService } from '../../services/auth.service';
import { DropdownComponent } from '../../components/resuable/dropdown/dropdown.component';

@Component({
  selector: 'app-super-admin-hostel-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DropdownComponent],
  templateUrl: './super-admin-hostel-detail.component.html',
  styleUrl: './super-admin-hostel-detail.component.scss',
})
export class SuperAdminHostelDetailComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly hostelService = inject(HostelService);
  private readonly authService   = inject(AuthService);
  private readonly fb            = inject(FormBuilder);

  hostel:   Hostel | null = null;
  loading   = true;
  toggling  = false;
  error     = '';

  // ── Payments ───────────────────────────────────────────────────────────────
  payments:        HostelPayment[] = [];
  paymentsLoading  = false;

  // ── Panel state ────────────────────────────────────────────────────────────
  subPanelOpen = signal(false);
  payPanelOpen = signal(false);
  savingSub    = false;
  savingPay    = false;
  subError     = '';
  payError     = '';

  // ── Subscription form ──────────────────────────────────────────────────────
  subscriptionForm = this.fb.group({
    planName:    ['', Validators.required],
    status:      ['active'],
    billingCycle:[''],
    seatLimit:   [null as number | null],
    startsAt:    [''],
    endsAt:      [''],
  });

  // ── Payment form ───────────────────────────────────────────────────────────
  paymentForm = this.fb.group({
    amount:        [null as number | null, Validators.required],
    currency:      ['INR'],
    paymentMethod: [''],
    status:        ['paid'],
    paidAt:        [''],
  });

  readonly statusOptions = [
    { label: 'Active',    value: 'active'    },
    { label: 'Trial',     value: 'trial'     },
    { label: 'Grace',     value: 'grace'     },
    { label: 'Expired',   value: 'expired'   },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  readonly billingOptions = [
    { label: 'Monthly',   value: 'monthly'   },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly',    value: 'yearly'    },
  ];

  readonly payStatusOptions = [
    { label: 'Paid',    value: 'paid'    },
    { label: 'Pending', value: 'pending' },
    { label: 'Failed',  value: 'failed'  },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.load(id);
  }

  private load(id: string): void {
    this.loading = true;
    this.hostelService.getHostel(id).subscribe({
      next: res => {
        this.hostel = res.data;
        this.loading = false;
        this.loadPayments();
      },
      error: () => { this.error = 'Failed to load hostel.'; this.loading = false; },
    });
  }

  loadPayments(): void {
    if (!this.hostel) return;
    this.paymentsLoading = true;
    this.hostelService.listPayments(this.hostel.id).subscribe({
      next:  res => { this.payments = res.data; this.paymentsLoading = false; },
      error: ()  => { this.paymentsLoading = false; },
    });
  }

  // ── Subscription panel ─────────────────────────────────────────────────────
  openSubPanel(): void {
    const sub = this.currentSubscription;
    this.subError = '';
    this.subscriptionForm.reset({
      planName:     sub?.planName     ?? '',
      status:       sub?.status       ?? 'active',
      billingCycle: sub?.billingCycle ?? '',
      seatLimit:    sub?.seatLimit    ?? null,
      startsAt:     sub?.startsAt     ? this.toInputDate(sub.startsAt) : '',
      endsAt:       sub?.endsAt       ? this.toInputDate(sub.endsAt)   : '',
    });
    this.subPanelOpen.set(true);
  }

  closeSubPanel(): void { this.subPanelOpen.set(false); }

  saveSubscription(): void {
    if (this.subscriptionForm.invalid || this.savingSub || !this.hostel) return;
    this.savingSub = true;
    this.subError  = '';

    const v = this.subscriptionForm.value;
    this.hostelService.upsertSubscription(this.hostel.id, {
      planName:     v.planName!,
      status:       v.status       || 'active',
      billingCycle: v.billingCycle || null,
      seatLimit:    v.seatLimit    ?? null,
      startsAt:     v.startsAt     || undefined,
      endsAt:       v.endsAt       || null,
    }).subscribe({
      next: res => {
        if (this.hostel) {
          this.hostel = { ...this.hostel, subscriptions: [res.data] };
        }
        this.savingSub = false;
        this.subPanelOpen.set(false);
      },
      error: () => { this.subError = 'Failed to save subscription.'; this.savingSub = false; },
    });
  }

  // ── Payment panel ──────────────────────────────────────────────────────────
  openPaymentPanel(): void {
    this.payError = '';
    this.paymentForm.reset({ currency: 'INR', status: 'paid' });
    this.payPanelOpen.set(true);
  }

  closePaymentPanel(): void { this.payPanelOpen.set(false); }

  savePayment(): void {
    if (this.paymentForm.invalid || this.savingPay || !this.hostel) return;
    this.savingPay = true;
    this.payError  = '';

    const v = this.paymentForm.value;
    this.hostelService.recordPayment(this.hostel.id, {
      amount:        v.amount!,
      currency:      v.currency      || 'INR',
      paymentMethod: v.paymentMethod || null,
      status:        v.status        || 'paid',
      paidAt:        v.paidAt        || null,
    }).subscribe({
      next: res => {
        this.payments = [res.data, ...this.payments];
        this.savingPay = false;
        this.payPanelOpen.set(false);
      },
      error: () => { this.payError = 'Failed to record payment.'; this.savingPay = false; },
    });
  }

  // ── Hostel actions ─────────────────────────────────────────────────────────
  goBack(): void { this.router.navigate(['/super-admin/hostels']); }

  toggleActive(value: boolean): void {
    if (!this.hostel || this.toggling) return;
    this.toggling = true;
    this.hostelService.updateHostel(this.hostel.id, { isActive: value }).subscribe({
      next:  res => { this.hostel = { ...this.hostel!, isActive: res.data.isActive }; this.toggling = false; },
      error: ()  => { this.toggling = false; },
    });
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  staffByRole(roleName: string): HostelStaffUser | undefined {
    return this.hostel?.users?.find(u => u.role?.name === roleName);
  }

  get primaryOwner() {
    return this.hostel?.owners?.find(o => o.isPrimary) ?? this.hostel?.owners?.[0] ?? null;
  }

  get currentSubscription() {
    return this.hostel?.subscriptions?.[0] ?? null;
  }

  get totalSeats(): number {
    return this.hostel?.settings?.totalSeats ?? 0;
  }

  // ── Formatters ─────────────────────────────────────────────────────────────
  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatType(t: string): string {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  formatAmount(amount: number, currency = 'INR'): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  }

  private toInputDate(isoStr: string): string {
    return isoStr ? isoStr.split('T')[0] : '';
  }
}
