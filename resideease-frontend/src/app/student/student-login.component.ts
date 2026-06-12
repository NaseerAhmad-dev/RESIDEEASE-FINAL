import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StudentService } from '../services/student.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './student-login.component.html',
  styleUrls: ['./student-login.component.scss']
})
export class StudentLoginComponent {
  loginForm = this.fb.group({
    rollNumber: ['', [Validators.required]],
    password:   ['', [Validators.required]],
  });

  errorMessage = '';
  loading      = false;
  showPassword = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly studentService: StudentService,
  ) {}

  togglePassword(): void { this.showPassword = !this.showPassword; }
  login(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter your roll number and password.';
      return;
    }

    const { rollNumber, password } = this.loginForm.value;
    this.loading = true;

    this.authService.loginStudent(rollNumber!.trim(), password!.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        const localStudent = this.studentService.getStudentsValue().find(
          s => s.rollNumber.toLowerCase() === res.data.user.rollNumber.toLowerCase()
        );
        if (localStudent) {
          this.router.navigate(['/student/profile', localStudent.id]);
        } else {
          this.router.navigate(['/student/profile', res.data.user.rollNumber]);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Invalid roll number or password.';
      },
    });
  }
}
