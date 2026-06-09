import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-super-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './super-admin-login.component.html',
  styleUrls: ['./super-admin-login.component.scss']
})
export class SuperAdminLoginComponent {
  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  errorMessage = '';
  loading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  login(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter username and password.';
      return;
    }

    const { username, password } = this.loginForm.value;
    this.loading = true;

    this.authService.loginManager(username!, password!).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.data?.user?.role !== 'super_admin') {
          this.authService.clearSession();
          this.errorMessage = 'Access denied. Super admin credentials required.';
          return;
        }
        this.router.navigate(['/super-admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Login failed. Please try again.';
      },
    });
  }
}
