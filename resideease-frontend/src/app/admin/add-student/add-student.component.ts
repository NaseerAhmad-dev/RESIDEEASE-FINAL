import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { skip, take } from 'rxjs/operators';
import { StudentService } from '../../services/student.service';
import { RoomService } from '../../services/room.service';
import { Room } from '../../models/room.model';

export interface RoomTypeCard {
  type: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
  minPrice: number;
  maxPrice: number;
  amenities: string[];
  availableCount: number;
  rooms: Room[];
}

const TYPE_META: Record<string, { label: string; description: string; icon: string; badge?: string }> = {
  single: { label: 'Single Room',    description: 'Private room for yourself',   icon: '🛏️'           },
  double: { label: 'Double Sharing', description: 'Shared with one roommate',     icon: '🪟', badge: 'Popular' },
  triple: { label: 'Triple Sharing', description: 'Shared with two roommates',    icon: '🏠'           },
};

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-student.component.html',
  styleUrl: './add-student.component.scss'
})
export class AddStudentComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly router         = inject(Router);
  private readonly studentService = inject(StudentService);
  private readonly roomService    = inject(RoomService);

  currentStep    = 0;
  submitted      = false;
  tempPassword   = '';
  submittedName  = '';
  submittedRoll  = '';
  credCopied     = false;

  steps = [
    { label: 'Boarder info' },
    { label: 'Room & stay'  },
    { label: 'Fee payment'  },
    { label: 'Confirm'      },
  ];

  // ── Room state ─────────────────────────────────────────────
  roomsLoading  = true;
  roomTypeCards: RoomTypeCard[] = [];
  selectedRoom    = '';           // type key: 'single' | 'double' | 'triple'
  selectedRoomObj: Room | null = null;  // specific room picked from dropdown

  // ── Derived ────────────────────────────────────────────────
  get roomsForType(): Room[] {
    return this.roomTypeCards.find(c => c.type === this.selectedRoom)?.rooms ?? [];
  }

  get roomPrice(): number {
    return this.selectedRoomObj?.price
      ?? this.roomTypeCards.find(c => c.type === this.selectedRoom)?.minPrice
      ?? 0;
  }

  get roomLabel(): string {
    return TYPE_META[this.selectedRoom]?.label ?? this.selectedRoom;
  }

  get paymentTotal(): number {
    const v = this.detailsForm.value;
    return (v.maintenanceCharge || 0) + (v.securityDeposit || 0) + (v.messFee || 0);
  }

  detailsForm!: FormGroup;
  previewUrl: string | null = null;

  // ── Lifecycle ───────────────────────────────────────────────
  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      firstName:         ['', [Validators.required, Validators.minLength(2)]],
      lastName:          ['', [Validators.required, Validators.minLength(2)]],
      email:             ['', [Validators.required, Validators.email]],
      phone:             ['', [Validators.required]],
      rollNumber:        ['', [Validators.required]],
      gender:            ['', Validators.required],
      department:        [''],
      checkInDate:       ['', Validators.required],
      roomNumber:        [''],
      currentSemester:   ['', Validators.required],
      residenceExpiry:   ['', Validators.required],
      residencyAccount:  ['university', Validators.required],
      maintenanceCharge: [0, [Validators.min(0)]],
      securityDeposit:   [0, [Validators.min(0)]],
      messFee:           [0, [Validators.min(0)]],
    });

    const cached = this.roomService.getRoomsValue();
    if (cached.length > 0) {
      // Rooms already loaded in service cache — use immediately
      this.buildRoomTypeCards(cached);
      this.roomsLoading = false;
    } else {
      // Need to fetch — wait for first HTTP response (skip the initial [] emission)
      this.roomsLoading = true;
      this.roomService.refresh();
      this.roomService.getRooms()
        .pipe(skip(1), take(1))
        .subscribe(rooms => {
          this.buildRoomTypeCards(rooms);
          this.roomsLoading = false;
        });
    }
  }

  // ── Room helpers ─────────────────────────────────────────────
  private buildRoomTypeCards(rooms: Room[]): void {
    const typeMap = new Map<string, Room[]>();
    for (const r of rooms) {
      if (!typeMap.has(r.type)) typeMap.set(r.type, []);
      typeMap.get(r.type)!.push(r);
    }

    const typeOrder = ['single', 'double', 'triple'];
    const allTypes  = [...new Set([...typeOrder, ...typeMap.keys()])].filter(t => typeMap.has(t));

    this.roomTypeCards = allTypes.map(type => {
      const all       = typeMap.get(type)!;
      const available = all.filter(r =>
        r.status !== 'maintenance' &&
        (!r.beds?.length || r.beds.some(b => b.status === 'available'))
      );
      const prices = all.map(r => r.price);
      const meta   = TYPE_META[type] ?? { label: type, description: '', icon: '🏠' };

      return {
        type,
        label:          meta.label,
        description:    meta.description,
        icon:           meta.icon,
        badge:          meta.badge,
        minPrice:       Math.min(...prices),
        maxPrice:       Math.max(...prices),
        amenities:      all[0]?.amenities ?? [],
        availableCount: available.length,
        rooms:          available,
      };
    });

    // Default: first card that has available rooms
    const first = this.roomTypeCards.find(c => c.availableCount > 0) ?? this.roomTypeCards[0];
    if (first) this.selectedRoom = first.type;
  }

  selectType(type: string): void {
    this.selectedRoom    = type;
    this.selectedRoomObj = null;
    this.detailsForm.patchValue({ roomNumber: '' });
  }

  onRoomNumberChange(event: Event): void {
    const roomNumber = (event.target as HTMLSelectElement).value;
    this.selectedRoomObj = this.roomsForType.find(r => r.roomNumber === roomNumber) ?? null;
    // Auto-fill price bar (read-only, shown below)
    this.detailsForm.patchValue({ roomNumber });
  }

  // ── Form helpers ─────────────────────────────────────────────
  onFileChange(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { this.previewUrl = r.result as string; };
    r.readAsDataURL(f);
  }

  getError(field: string): string {
    const c = this.detailsForm.get(field);
    if (!c?.touched || !c.errors) return '';
    if (c.errors['required'])  return 'Required';
    if (c.errors['minlength']) return `Min ${c.errors['minlength'].requiredLength} chars`;
    if (c.errors['email'])     return 'Invalid email';
    return '';
  }

  isStepValid(): boolean {
    if (this.currentStep === 0) {
      const fields = ['firstName','lastName','email','phone','rollNumber','gender','checkInDate'];
      fields.forEach(f => this.detailsForm.get(f)?.markAsTouched());
      return fields.every(f => this.detailsForm.get(f)?.valid);
    }
    if (this.currentStep === 1) {
      const fields = ['currentSemester','residenceExpiry'];
      fields.forEach(f => this.detailsForm.get(f)?.markAsTouched());
      return fields.every(f => this.detailsForm.get(f)?.valid);
    }
    if (this.currentStep === 2) {
      const fields = ['residencyAccount','maintenanceCharge','securityDeposit','messFee'];
      fields.forEach(f => this.detailsForm.get(f)?.markAsTouched());
      return fields.every(f => this.detailsForm.get(f)?.valid);
    }
    return true;
  }

  next(): void  { if (this.isStepValid() && this.currentStep < this.steps.length - 1) this.currentStep++; }
  back(): void  { if (this.currentStep > 0) this.currentStep--; }

  submit(): void {
    if (!this.isStepValid()) return;
    const v = this.detailsForm.value;
    this.studentService.addStudent({
      firstName:         v.firstName,
      lastName:          v.lastName,
      email:             v.email,
      phone:             v.phone,
      rollNumber:        v.rollNumber,
      gender:            v.gender,
      department:        v.department,
      checkInDate:       v.checkInDate,
      roomNumber:        v.roomNumber,
      currentSemester:   v.currentSemester,
      residenceExpiry:   v.residenceExpiry,
      selectedRoom:      this.selectedRoom,
      roomPrice:         this.roomPrice,
      residencyAccount:  v.residencyAccount,
      maintenanceCharge: v.maintenanceCharge,
      securityDeposit:   v.securityDeposit,
      messFee:           v.messFee,
      totalPayment:      this.paymentTotal,
      paidAmount:        0,
      paymentStatus:     'partial' as const,
      profilePicture:    this.previewUrl || undefined,
      status:            'pending' as const,
    }).subscribe({
      next: (student) => {
        this.submitted     = true;
        this.tempPassword  = student.tempPassword ?? '';
        this.submittedName = `${student.firstName} ${student.lastName}`;
        this.submittedRoll = student.rollNumber;
      },
      error: () => {},
    });
  }

  copyCredentials(): void {
    const text = `Roll Number: ${this.submittedRoll}\nPassword: ${this.tempPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      this.credCopied = true;
      setTimeout(() => { this.credCopied = false; }, 2000);
    });
  }

  goToStudents(): void { this.router.navigate(['/admin/students']); }
}
