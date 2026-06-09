import { Component, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { OnboardingService } from '../../services/onboarding.service';
import { ROOM_OPTIONS, MEAL_PLANS } from '../../models/onboarding.model';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, ProgressBarComponent],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent implements OnInit {
  steps = [
    { label: 'Welcome',  route: 'welcome' },
    { label: 'Profile',  route: 'user-details' },
    { label: 'Room',     route: 'room-selection' },
    { label: 'Mess',     route: 'mess-selection' },
    { label: 'Confirm',  route: 'confirmation' }
  ];

  submitted = false;

  data = computed(() => this.onboarding.data());
  roomPrice = computed(() => this.onboarding.getRoomPrice());
  mealPrice = computed(() => this.onboarding.getMealPrice());
  totalMonthly = computed(() => this.onboarding.getTotalMonthly());

  get roomLabel(): string {
    return ROOM_OPTIONS.find(r => r.id === this.data().roomPreferences.roomType)?.label ?? '—';
  }

  get mealLabel(): string {
    return MEAL_PLANS.find(p => p.id === this.data().messPreferences.mealPlan)?.label ?? '—';
  }

  get fullName(): string {
    const u = this.data().userDetails;
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
  }

  constructor(public router: Router, private onboarding: OnboardingService) {}

  ngOnInit(): void {}

  back(): void { this.router.navigate(['/onboarding/mess-selection']); }

  submit(): void { this.submitted = true; }

  startOver(): void {
    this.onboarding.reset();
    this.router.navigate(['/onboarding/welcome']);
  }
}
