import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Student } from '../../models/student.model';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    TableModule, ButtonModule, InputTextModule, DropdownModule, TagModule, ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss'
})
export class StudentsListComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table!: Table;
  private destroy$ = new Subject<void>();

  students: Student[] = [];
  selectedStudents: Student[] = [];
  loading = true;

  searchValue = '';
  selectedStatus: string | null = null;
  selectedGender: string | null = null;

  readonly statusOptions = [
    { label: 'Active',      value: 'active' },
    { label: 'Pending',     value: 'pending' },
    { label: 'Expired',     value: 'expired' },
    { label: 'Checked Out', value: 'checked_out' },
    { label: 'Inactive',    value: 'inactive' }
  ];

  readonly genderOptions = [
    { label: 'Male',   value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other',  value: 'other' }
  ];

  private readonly avatarPalette = [
    '#0ab4a8', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f97316', '#10b981', '#06b6d4', '#ef4444'
  ];

  constructor(
    private readonly studentService: StudentService,
    private readonly router: Router,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.studentService.getStudents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(students => {
        this.students = students;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGlobalFilter(event: Event): void {
    this.table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onStatusChange(value: string | null): void {
    this.table.filter(value, 'status', 'equals');
  }

  onGenderChange(value: string | null): void {
    this.table.filter(value, 'gender', 'equals');
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedStatus = null;
    this.selectedGender = null;
    this.table.clear();
  }

  isRowSelected(student: Student): boolean {
    return this.selectedStudents.some(s => s.id === student.id);
  }

  navigateToView(id: string): void {
    this.router.navigate(['/admin/students/view', id]);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/admin/students/edit', id]);
  }

  deleteStudent(student: Student, event: Event): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      key: 'checkoutConfirm',
      message: `Check out <strong>${student.firstName} ${student.lastName}</strong>?<br>Their status will be updated to <em>Checked Out</em>.`, // boarder
      header: 'Confirm Check Out',
      acceptLabel: 'Yes, Check Out',
      rejectLabel: 'Cancel',
      accept: () => {
        this.studentService.updateStudent(student.id, { status: 'checked_out' });
      }
    });
  }

  deleteSelected(): void {
    const count = this.selectedStudents.length;
    this.confirmationService.confirm({
      key: 'checkoutConfirm',
      message: `Check out <strong>${count} boarder${count !== 1 ? 's' : ''}</strong>?<br>Their statuses will be updated to <em>Checked Out</em>.`,
      header: 'Confirm Bulk Check Out',
      acceptLabel: 'Yes, Check Out All',
      rejectLabel: 'Cancel',
      accept: () => {
        this.selectedStudents.forEach(s =>
          this.studentService.updateStudent(s.id, { status: 'checked_out' })
        );
        this.selectedStudents = [];
      }
    });
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'secondary' | 'info' | 'danger' {
    const map: Record<string, 'success' | 'warning' | 'secondary' | 'info' | 'danger'> = {
      active:      'success',
      pending:     'warning',
      expired:     'danger',
      checked_out: 'secondary',
      inactive:    'secondary'
    };
    return map[status] ?? 'info';
  }

  getAvatarColor(name: string): string {
    return this.avatarPalette[name.charCodeAt(0) % this.avatarPalette.length];
  }

  exportToCSV(): void {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Roll No.', 'Gender', 'Department', 'Semester', 'Room', 'Room Price', 'Status', 'Joined'];
    const rows = this.students.map(s => [
      s.firstName, s.lastName, s.email, s.phone, s.rollNumber,
      s.gender, s.department ?? '', s.currentSemester, s.selectedRoom,
      s.roomPrice, s.status, new Date(s.createdAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(f => `"${f}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToJSON(): void {
    const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.students, null, 2));
    const a = document.createElement('a');
    a.href = uri;
    a.download = `students_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }
}
