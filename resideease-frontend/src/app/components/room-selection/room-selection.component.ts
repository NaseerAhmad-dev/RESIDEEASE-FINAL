import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { OnboardingService } from '../../services/onboarding.service';
import { ROOM_OPTIONS } from '../../models/onboarding.model';
import { DropdownComponent, DropdownOption } from '../resuable/dropdown/dropdown.component';

@Component({
  selector: 'app-room-selection',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProgressBarComponent, DropdownComponent],
  templateUrl: './room-selection.component.html',
  styleUrl: './room-selection.component.scss'
})
export class RoomSelectionComponent implements OnInit {
  readonly floorOptions: DropdownOption[] = [
    { label: 'No preference',      value: 'no-preference' },
    { label: 'Lower floors (1–3)', value: 'low'           },
    { label: 'Mid floors (4–6)',   value: 'mid'           },
    { label: 'Higher floors (7+)', value: 'high'          },
  ];

  steps = [
    { label: 'Welcome',  route: 'welcome' },
    { label: 'Profile',  route: 'user-details' },
    { label: 'Room',     route: 'room-selection' },
    { label: 'Mess',     route: 'mess-selection' },
    { label: 'Confirm',  route: 'confirmation' }
  ];

  roomOptions = ROOM_OPTIONS;
  form!: FormGroup;
  selectedRoom = 'single';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private onboarding: OnboardingService
  ) {}

  ngOnInit(): void {
    const saved = this.onboarding.data().roomPreferences;
    this.selectedRoom = saved.roomType ?? 'single';

    this.form = this.fb.group({
      roomType:        [this.selectedRoom, Validators.required],
      floor:           [saved.floor ?? 'no-preference'],
      quietZone:       [saved.quietZone ?? false],
      wifiPriority:    [saved.wifiPriority ?? false],
      nearCommonRoom:  [saved.nearCommonRoom ?? false],
      checkInDate:     [saved.checkInDate ?? '', Validators.required]
    });
  }

  selectRoom(id: string): void {
    this.selectedRoom = id;
    this.form.patchValue({ roomType: id });
  }

  getSelectedPrice(): number {
    return this.roomOptions.find(r => r.id === this.selectedRoom)?.price ?? 0;
  }

  back(): void { this.router.navigate(['/onboarding/user-details']); }

  next(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.onboarding.updateRoomPreferences(this.form.value);
    this.router.navigate(['/onboarding/mess-selection']);
  }
}
