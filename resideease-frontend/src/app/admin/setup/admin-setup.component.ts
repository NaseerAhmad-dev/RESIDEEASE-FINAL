import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RoomService } from '../../services/room.service';
import { BedService, Bed } from '../../services/bed.service';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { Room, ROOM_AMENITIES, ROOM_PRICE, ROOM_CAPACITY } from '../../models/room.model';
import { environment } from '../../../environments/environment';

type Step = 'room' | 'beds' | 'student' | 'done';

@Component({
  selector: 'app-admin-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, TitleCasePipe],
  templateUrl: './admin-setup.component.html',
  styleUrl: './admin-setup.component.scss',
})
export class AdminSetupComponent implements OnInit {
  private readonly fb            = inject(FormBuilder);
  private readonly router        = inject(Router);
  private readonly http          = inject(HttpClient);
  private readonly roomService   = inject(RoomService);
  private readonly bedService    = inject(BedService);
  private readonly studentService = inject(StudentService);
  private readonly authService   = inject(AuthService);

  currentStep: Step = 'room';
  loading = false;
  error   = '';

  createdRoom: Room | null = null;
  bedRows: { bedNumber: string; status: 'available' | 'occupied' | 'maintenance' }[] = [];

  roomForm!: FormGroup;
  studentForm!: FormGroup;

  readonly roomTypes  = ['single', 'double', 'triple'];
  readonly bedStatuses = ['available', 'occupied', 'maintenance'];

  steps: { key: Step; label: string; index: number }[] = [
    { key: 'room',    label: 'Add Room',    index: 0 },
    { key: 'beds',    label: 'Add Beds',    index: 1 },
    { key: 'student', label: 'Onboard Resident', index: 2 },
  ];

  get currentStepIndex(): number {
    return this.steps.find(s => s.key === this.currentStep)?.index ?? 0;
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  ngOnInit(): void {
    this.roomForm = this.fb.group({
      roomNumber: ['', Validators.required],
      floor:      [1,  [Validators.required, Validators.min(0)]],
      type:       ['double', Validators.required],
      capacity:   [2,  [Validators.required, Validators.min(1), Validators.max(10)]],
      price:      ['', [Validators.required, Validators.min(1)]],
    });

    this.studentForm = this.fb.group({
      firstName:  ['', [Validators.required, Validators.minLength(2)]],
      lastName:   ['', [Validators.required, Validators.minLength(2)]],
      email:      ['', [Validators.required, Validators.email]],
      phone:      ['', Validators.required],
      rollNumber: ['', Validators.required],
      gender:     ['', Validators.required],
      checkInDate:['', Validators.required],
    });

    this.roomForm.get('type')!.valueChanges.subscribe(type => this.onTypeChange(type));
    this.onTypeChange('double');
  }

  onTypeChange(type: string): void {
    const capacity = ROOM_CAPACITY[type as keyof typeof ROOM_CAPACITY] ?? 2;
    const price    = ROOM_PRICE[type as keyof typeof ROOM_PRICE] ?? 5000;
    this.roomForm.patchValue({ capacity, price }, { emitEvent: false });
    this.rebuildBedRows(capacity);
  }

  private rebuildBedRows(capacity: number): void {
    const letters = 'ABCDEFGHIJ';
    this.bedRows = Array.from({ length: capacity }, (_, i) => ({
      bedNumber: letters[i] ?? String(i + 1),
      status: 'available' as const,
    }));
  }

  onCapacityChange(): void {
    const cap = parseInt(this.roomForm.get('capacity')!.value, 10);
    if (cap > 0 && cap <= 10) this.rebuildBedRows(cap);
  }

  setBedStatus(index: number, status: 'available' | 'occupied' | 'maintenance'): void {
    this.bedRows[index] = { ...this.bedRows[index], status };
  }

  // ── Step 1: Create Room ──────────────────────────────────────────────────────
  submitRoom(): void {
    if (this.roomForm.invalid) { this.roomForm.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    const { roomNumber, floor, type, capacity, price } = this.roomForm.value;
    const amenities = ROOM_AMENITIES[type as keyof typeof ROOM_AMENITIES] ?? [];

    this.roomService.createRoom({ roomNumber, floor, type, capacity, price, amenities, status: 'active' }).subscribe({
      next: room => {
        this.createdRoom = room;
        this.rebuildBedRows(room.capacity);
        this.loading = false;
        this.currentStep = 'beds';
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Failed to create room';
        this.loading = false;
      },
    });
  }

  // ── Step 2: Save Beds ────────────────────────────────────────────────────────
  submitBeds(): void {
    if (!this.createdRoom) return;
    this.loading = true;
    this.error   = '';

    this.bedService.bulkCreate(this.createdRoom.id, this.bedRows).subscribe({
      next: () => {
        this.loading = false;
        this.currentStep = 'student';
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Failed to save beds';
        this.loading = false;
      },
    });
  }

  // ── Step 3: Create Student ───────────────────────────────────────────────────
  submitStudent(): void {
    if (this.studentForm.invalid) { this.studentForm.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    const v = this.studentForm.value;
    const studentData = {
      ...v,
      roomNumber:  this.createdRoom?.roomNumber ?? '',
      selectedRoom: this.createdRoom?.type ?? 'double',
      roomPrice:    this.createdRoom?.price ?? 0,
      paymentStatus: 'unpaid' as const,
      status: 'active' as const,
    };

    this.studentService.addStudent(studentData).subscribe({
      next: () => {
        this.loading = false;
        this.completeOnboarding();
      },
      error: err => {
        this.error   = err?.error?.message ?? 'Failed to add student';
        this.loading = false;
      },
    });
  }

  // ── Finish ───────────────────────────────────────────────────────────────────
  private completeOnboarding(): void {
    this.http.post<any>(
      `${environment.apiUrl}/admin/onboarding/complete`,
      {},
      { headers: this.headers }
    ).subscribe({
      next: () => {
        this.authService.markOnboardingComplete();
        this.currentStep = 'done';
      },
      error: () => {
        // Even if API call fails, mark locally and proceed
        this.authService.markOnboardingComplete();
        this.currentStep = 'done';
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  getError(form: FormGroup, field: string): string {
    const c = form.get(field);
    if (!c?.touched || !c.errors) return '';
    if (c.errors['required'])  return 'Required';
    if (c.errors['minlength']) return `Min ${c.errors['minlength'].requiredLength} chars`;
    if (c.errors['email'])     return 'Invalid email';
    if (c.errors['min'])       return `Min value ${c.errors['min'].min}`;
    if (c.errors['max'])       return `Max value ${c.errors['max'].max}`;
    return '';
  }
}
