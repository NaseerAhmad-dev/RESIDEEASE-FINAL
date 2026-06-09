import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { OnboardingService } from '../../services/onboarding.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, ProgressBarComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  steps = [
    { label: 'Welcome',    route: 'welcome' },
    { label: 'Profile',    route: 'user-details' },
    { label: 'Room',       route: 'room-selection' },
    { label: 'Mess',       route: 'mess-selection' },
    { label: 'Confirm',    route: 'confirmation' }
  ];

  features = [
    { icon: '🏠', label: 'Room Management',     desc: 'Track occupancy & maintenance' },
    { icon: '🍽️', label: 'Mess Planning',        desc: 'Flexible meal plans daily' },
    { icon: '💳', label: 'Digital Payments',     desc: 'Pay dues online, zero hassle' },
    { icon: '📣', label: 'Instant Notices',      desc: 'Never miss an announcement' }
  ];

  constructor(private router: Router, private onboarding: OnboardingService) {}

  begin(): void {
    this.router.navigate(['/onboarding/user-details']);
  }
}
