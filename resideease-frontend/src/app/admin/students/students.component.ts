import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentsListComponent } from './students-list.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, RouterLink, StudentsListComponent],
  template: `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <h1 style="font-size:22px;font-weight:700;color:var(--text-primary);letter-spacing:-0.02em">Students</h1>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:2px">Manage students for your hostel</p>
        </div>
      </div>
      <app-students-list></app-students-list>
    </div>
  `
})
export class StudentsComponent {}
