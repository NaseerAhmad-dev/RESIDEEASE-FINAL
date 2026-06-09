import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ROOM_OPTIONS } from '../../models/onboarding.model';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-add-student',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-student.component.html',
  styleUrl: './add-student.component.scss'
})
export class AddStudentComponent implements OnInit {
  currentStep = 0;
  submitted = false;

  steps = [
    { label: 'Student info' },
    { label: 'Room & stay' },
    { label: 'Fee payment' },
    { label: 'Confirm' },
  ];

  roomOptions = ROOM_OPTIONS;

  detailsForm!: FormGroup;
  selectedRoom   = 'single';
  previewUrl: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private studentService: StudentService) {}

  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      firstName:        ['', [Validators.required, Validators.minLength(2)]],
      lastName:         ['', [Validators.required, Validators.minLength(2)]],
      email:            ['', [Validators.required, Validators.email]],
      phone:            ['', [Validators.required]],
      rollNumber:       ['', [Validators.required]],
      gender:           ['', Validators.required],
      department:       [''],
      checkInDate:      ['', Validators.required],
      roomNumber:       [''],
      currentSemester:  ['', Validators.required],
      residenceExpiry:  ['', Validators.required],
      residencyAccount: ['university', Validators.required],
      maintenanceCharge:[0, [Validators.min(0)]],
      securityDeposit:  [0, [Validators.min(0)]],
      messFee:          [0, [Validators.min(0)]],
    });
  }

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
    if (c.errors['required'])   return 'Required';
    if (c.errors['minlength'])  return `Min ${c.errors['minlength'].requiredLength} chars`;
    if (c.errors['email'])      return 'Invalid email';
    return '';
  }

  selectRoom(id: string): void { this.selectedRoom = id; }

  get roomPrice(): number { return ROOM_OPTIONS.find(r => r.id === this.selectedRoom)?.price ?? 0; }
  get roomLabel(): string { return ROOM_OPTIONS.find(r => r.id === this.selectedRoom)?.label ?? ''; }
  get paymentTotal(): number {
    const value = this.detailsForm.value;
    return (value.maintenanceCharge || 0) + (value.securityDeposit || 0) + (value.messFee || 0);
  }

  isStepValid(): boolean {
    if (this.currentStep === 0) {
      const controls = ['firstName', 'lastName', 'email', 'phone', 'rollNumber', 'gender', 'checkInDate'];
      const invalid = controls.some(name => this.detailsForm.get(name)?.invalid);
      if (invalid) {
        controls.forEach(name => this.detailsForm.get(name)?.markAsTouched());
      }
      return !invalid;
    }

    if (this.currentStep === 1) {
      const controls = ['currentSemester', 'residenceExpiry'];
      const invalid = controls.some(name => this.detailsForm.get(name)?.invalid);
      if (invalid) {
        controls.forEach(name => this.detailsForm.get(name)?.markAsTouched());
      }
      return !invalid;
    }

    if (this.currentStep === 2) {
      const controls = ['residencyAccount', 'maintenanceCharge', 'securityDeposit', 'messFee'];
      const invalid = controls.some(name => this.detailsForm.get(name)?.invalid);
      if (invalid) {
        controls.forEach(name => this.detailsForm.get(name)?.markAsTouched());
      }
      return !invalid;
    }

    return true;
  }

  next(): void {
    if (!this.isStepValid()) {
      return;
    }
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  back(): void { if (this.currentStep > 0) this.currentStep--; }

  submit(): void {
    if (!this.isStepValid()) {
      return;
    }

    const formValue = this.detailsForm.value;
    const studentData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      rollNumber: formValue.rollNumber,
      gender: formValue.gender,
      department: formValue.department,
      checkInDate: formValue.checkInDate,
      roomNumber: formValue.roomNumber,
      currentSemester: formValue.currentSemester,
      residenceExpiry: formValue.residenceExpiry,
      selectedRoom: this.selectedRoom,
      roomPrice: this.roomPrice,
      residencyAccount: formValue.residencyAccount,
      maintenanceCharge: formValue.maintenanceCharge,
      securityDeposit: formValue.securityDeposit,
      messFee: formValue.messFee,
      totalPayment: this.paymentTotal,
      paidAmount: 0,
      paymentStatus: 'partial' as const,
      profilePicture: this.previewUrl || undefined,
      status: 'pending' as const
    };

    this.studentService.addStudent(studentData).subscribe({
      next: () => { this.submitted = true; },
      error: () => {}
    });
  }

  goToStudents(): void { this.router.navigate(['/admin/students']); }
}
