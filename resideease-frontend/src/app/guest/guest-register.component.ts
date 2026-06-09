import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GuestService } from '../services/guest.service';
import { GuestRegistration } from '../models/guest.model';
import { AppValidators, FieldErrorComponent } from '../shared';

@Component({
  selector: 'app-guest-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './guest-register.component.html',
  styleUrls: ['./guest-register.component.scss']
})
export class GuestRegisterComponent implements OnInit, OnDestroy {
  step: 1 | 2 | 3 | 4 = 1;

  detailsForm = this.fb.group({
    fullName:      ['', [Validators.required, Validators.minLength(3)]],
    phone:         ['', [Validators.required, AppValidators.phone]],
    aadhaarNumber: ['', [Validators.required, AppValidators.aadhaar]],
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, AppValidators.otp]],
  });

  generatedOtp = '';
  otpError = '';
  guestFee = 0;
  registeredGuest: GuestRegistration | null = null;
  resendTimer = 0;
  loading = false;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly guestService: GuestService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.guestFee = this.guestService.getGuestFee();
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  get f() { return this.detailsForm.controls; }
  get otpF() { return this.otpForm.controls; }

  submitDetails() {
    if (this.detailsForm.invalid) { this.detailsForm.markAllAsTouched(); return; }
    const phone = this.detailsForm.value.phone!;
    this.loading = true;
    this.guestService.generateOtp(phone).subscribe({
      next: res => {
        this.generatedOtp = res.otp ?? '';
        this.loading = false;
        this.startResendTimer();
        this.step = 2;
      },
      error: () => { this.loading = false; }
    });
  }

  verifyOtp() {
    this.otpError = '';
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    const otp   = this.otpForm.value.otp!;
    const phone = this.detailsForm.value.phone!;
    this.loading = true;
    this.guestService.verifyOtp(phone, otp).subscribe({
      next: verified => {
        this.loading = false;
        if (verified) { this.step = 3; }
        else { this.otpError = 'Invalid OTP. Please try again.'; }
      },
      error: () => {
        this.loading = false;
        this.otpError = 'Invalid OTP. Please try again.';
      }
    });
  }

  resendOtp() {
    const phone = this.detailsForm.value.phone!;
    this.guestService.generateOtp(phone).subscribe({
      next: res => {
        this.generatedOtp = res.otp ?? '';
        this.startResendTimer();
        this.otpError = '';
        this.otpForm.reset();
      },
      error: () => {}
    });
  }

  private startResendTimer() {
    this.resendTimer = 30;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) { clearInterval(this.timerInterval!); this.resendTimer = 0; }
    }, 1000);
  }

  payFee() {
    const { fullName, phone, aadhaarNumber } = this.detailsForm.value;
    this.loading = true;
    this.guestService.registerGuest({
      fullName:      fullName!,
      phone:         phone!,
      aadhaarNumber: aadhaarNumber!,
      feePaid:       true,
      feeAmount:     this.guestFee,
      status:        'paid'
    }).subscribe({
      next: guest => {
        this.registeredGuest = guest;
        this.loading = false;
        this.step = 4;
      },
      error: () => { this.loading = false; }
    });
  }

  goHome() { this.router.navigate(['/']); }

  get maskedAadhaar(): string {
    const num = this.detailsForm.value.aadhaarNumber ?? '';
    return 'XXXX XXXX ' + num.slice(-4);
  }
}
