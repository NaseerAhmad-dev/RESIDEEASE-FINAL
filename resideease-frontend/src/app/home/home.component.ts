import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  form = this.fb.group({
    identifier: ['', Validators.required],
    secret:     ['', Validators.required],
  });

  error   = '';
  loading = false;
  showSecret = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  login(): void {
    this.error = '';
    if (this.form.invalid) { this.error = 'Please fill in both fields.'; return; }

    const { identifier, secret } = this.form.value;
    this.loading = true;

    // Try staff login first
    this.authService.loginManager(identifier!, secret!).subscribe({
      next: res => {
        this.loading = false;
        const role = res.data?.user?.role;
        if (role === 'super_admin') {
          this.router.navigate(['/super-admin/dashboard']);
        } else if (role === 'admin') {
          const onboarded = res.data?.user?.onboardingCompleted;
          this.router.navigate([onboarded ? '/admin/dashboard' : '/admin/setup']);
        } else if (role === 'office') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'manager') {
          this.router.navigate(['/manager/dashboard']);
        } else {
          this.authService.clearSession();
          this.tryStudentLogin(identifier!, secret!);
        }
      },
      error: () => this.tryEmployeeLogin(identifier!, secret!),
    });
  }

  private tryEmployeeLogin(email: string, password: string): void {
    this.authService.loginEmployee(email, password).subscribe({
      next: res => {
        this.loading = false;
        const role = res.data?.user?.role;
        if (role === 'mess_manager' || role === 'warden' || role === 'accountant') {
          this.router.navigate(['/manager/dashboard']);
        } else {
          this.authService.clearSession();
          this.tryStudentLogin(email, password);
        }
      },
      error: () => this.tryStudentLogin(email, password),
    });
  }

  private tryStudentLogin(rollNumber: string, phone: string): void {
    this.authService.loginStudent(rollNumber, phone).subscribe({
      next: res => {
        this.loading = false;
        this.router.navigate(['/student/profile', res.data.user.id]);
      },
      error: () => {
        this.loading = false;
        this.error = 'Invalid credentials. Please check and try again.';
      },
    });
  }

  registerAsGuest(): void {
    this.router.navigate(['/guest/register']);
  }
}
