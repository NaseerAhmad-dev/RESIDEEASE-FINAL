import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgressBarComponent],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent implements OnInit {
  steps = [
    { label: 'Welcome',  route: 'welcome' },
    { label: 'Profile',  route: 'user-details' },
    { label: 'Room',     route: 'room-selection' },
    { label: 'Mess',     route: 'mess-selection' },
    { label: 'Confirm',  route: 'confirmation' }
  ];

  form!: FormGroup;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private onboarding: OnboardingService
  ) {}

  ngOnInit(): void {
    const saved = this.onboarding.data().userDetails;
    this.form = this.fb.group({
      firstName:   [saved.firstName   ?? '', [Validators.required, Validators.minLength(2)]],
      lastName:    [saved.lastName    ?? '', [Validators.required, Validators.minLength(2)]],
      email:       [saved.email       ?? '', [Validators.required, Validators.email]],
      phone:       [saved.phone       ?? '', [Validators.required, Validators.pattern(/^[+\d\s\-()]{7,15}$/)]],
      rollNumber:  [saved.rollNumber  ?? '', [Validators.required, Validators.minLength(3)]],
      gender:      [''                     , Validators.required],
      department:  ['']
    });
    if (saved.profilePicture) this.previewUrl = saved.profilePicture;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  getError(field: string): string {
    const c = this.form.get(field);
    if (!c?.touched || !c.errors) return '';
    if (c.errors['required'])   return 'This field is required.';
    if (c.errors['minlength'])  return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    if (c.errors['email'])      return 'Enter a valid email address.';
    if (c.errors['pattern'])    return 'Enter a valid phone number.';
    return '';
  }

  back(): void { this.router.navigate(['/onboarding/welcome']); }

  next(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.onboarding.updateUserDetails({
      ...this.form.value,
      profilePicture: this.previewUrl ?? undefined
    });
    this.router.navigate(['/onboarding/room-selection']);
  }
}
