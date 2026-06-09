import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownOption } from '../../components/resuable/dropdown/dropdown.component';
import { MasterDataService } from '../../services/master-data.service';

@Component({
  selector: 'app-manager-notices',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  template: `
    <div class="coming-soon">
      <div class="notice-filter">
        <app-dropdown
          label="Notice type"
          [options]="noticeTypeOptions"
          placeholder="Select notice type"
          [(ngModel)]="selectedNoticeType"
          [showFilter]="false"
          optionLabel="label"
          optionValue="value"
        ></app-dropdown>
      </div>
      <svg width="48" height="48" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a6 6 0 00-6 6v3l-2 2v1h16v-1l-2-2V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z"
              stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      <h2>Notices</h2>
      <p>Post and manage hostel announcements — coming soon.</p>
    </div>
  `,
  styles: [`
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.2rem;
      height: 40rem;
      color: var(--text-muted);
    }

    .notice-filter {
      width: 100%;
      max-width: 28rem;
      align-self: flex-start;
    }

    .coming-soon svg { opacity: 0.35; }
    .coming-soon h2 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .coming-soon p {
      font-size: 1.4rem;
      margin: 0;
    }
  `]
})
export class ManagerNoticesComponent {
  selectedNoticeType: string | null = null;
  noticeTypeOptions: DropdownOption[] = [];

  constructor(private readonly masterData: MasterDataService) {
    this.noticeTypeOptions = this.masterData.getNoticeTypeOptions();
  }
}
