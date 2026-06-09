import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { Student } from '../../models/student.model';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonModule, RouterLink, TagModule, TabViewModule],
  templateUrl: './student-view.component.html',
  styleUrl: './student-view.component.scss'
})
export class StudentViewComponent implements OnInit {
  student: Student | null = null;
  notFound = false;

  private readonly avatarPalette = [
    '#0ab4a8', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f97316', '#10b981', '#06b6d4', '#ef4444'
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly studentService: StudentService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const found = id ? this.studentService.getStudentById(id) : undefined;
    if (found) {
      this.student = found;
    } else {
      this.notFound = true;
    }
  }

  goBack(): void { this.router.navigate(['/admin/students']); }

  getAvatarColor(name: string): string {
    return this.avatarPalette[name.charCodeAt(0) % this.avatarPalette.length];
  }

  getStatusLabel(status: string): string {
    return status === 'checked_out' ? 'Checked Out'
      : status.charAt(0).toUpperCase() + status.slice(1);
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'secondary' | 'danger' | 'info' {
    const map: Record<string, any> = {
      active: 'success', pending: 'warning',
      expired: 'danger', checked_out: 'secondary', inactive: 'secondary'
    };
    return map[status] ?? 'info';
  }
}
