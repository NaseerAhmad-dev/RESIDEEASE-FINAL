import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { OnboardingService } from '../../services/onboarding.service';
import { MEAL_PLANS, DIETARY_OPTIONS } from '../../models/onboarding.model';

@Component({
  selector: 'app-mess-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgressBarComponent],
  templateUrl: './mess-selection.component.html',
  styleUrl: './mess-selection.component.scss'
})
export class MessSelectionComponent implements OnInit {
  steps = [
    { label: 'Welcome',  route: 'welcome' },
    { label: 'Profile',  route: 'user-details' },
    { label: 'Room',     route: 'room-selection' },
    { label: 'Mess',     route: 'mess-selection' },
    { label: 'Confirm',  route: 'confirmation' }
  ];

  mealPlans = MEAL_PLANS;
  dietaryOptions = DIETARY_OPTIONS;

  form!: FormGroup;
  selectedPlan = 'full-board';
  selectedDiet: Set<string> = new Set();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private onboarding: OnboardingService
  ) {}

  ngOnInit(): void {
    const saved = this.onboarding.data().messPreferences;
    this.selectedPlan = saved.mealPlan ?? 'full-board';
    this.selectedDiet = new Set(saved.dietaryPreferences ?? []);

    this.form = this.fb.group({
      mealPlan:          [this.selectedPlan],
      specialRequirements: [saved.specialRequirements ?? '']
    });
  }

  selectPlan(id: string): void {
    this.selectedPlan = id;
    this.form.patchValue({ mealPlan: id });
  }

  toggleDiet(option: string): void {
    this.selectedDiet.has(option)
      ? this.selectedDiet.delete(option)
      : this.selectedDiet.add(option);
  }

  isDietSelected(option: string): boolean {
    return this.selectedDiet.has(option);
  }

  getSelectedPlanPrice(): number {
    return this.mealPlans.find(p => p.id === this.selectedPlan)?.price ?? 0;
  }

  back(): void { this.router.navigate(['/onboarding/room-selection']); }

  next(): void {
    this.onboarding.updateMessPreferences({
      mealPlan: this.selectedPlan as any,
      dietaryPreferences: Array.from(this.selectedDiet),
      specialRequirements: this.form.value.specialRequirements
    });
    this.router.navigate(['/onboarding/confirmation']);
  }
}
