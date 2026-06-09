import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-manager-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manager-login.component.html',
  styleUrls: ['./manager-login.component.scss']
})
export class ManagerLoginComponent {
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
      next: () => {
        this.loading = false;
        this.router.navigate(['/manager/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Login failed. Please try again.';
      },
    });
  }
}
