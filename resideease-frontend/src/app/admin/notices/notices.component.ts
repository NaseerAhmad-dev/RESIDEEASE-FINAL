import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Notice, NoticeCategory, NoticePriority } from '../../models/notice.model';
import { NoticeService } from '../../services/notice.service';
import { DropdownComponent, DropdownOption } from '../../components/resuable/dropdown/dropdown.component';

@Component({
  selector: 'app-notices',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss'
})
export class NoticesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allNotices: Notice[]      = [];
  filteredNotices: Notice[] = [];

  searchQuery    = '';
  filterCategory = '';
  filterPriority = '';
  showPinnedOnly = false;

  readonly categoryOptions: DropdownOption[] = [
    { label: 'General',     value: 'general'     },
    { label: 'Academic',    value: 'academic'     },
    { label: 'Hostel',      value: 'hostel'       },
    { label: 'Maintenance', value: 'maintenance'  },
    { label: 'Emergency',   value: 'emergency'    },
  ];

  readonly priorityOptions: DropdownOption[] = [
    { label: 'Normal',    value: 'normal'    },
    { label: 'Important', value: 'important' },
    { label: 'Urgent',    value: 'urgent'    },
  ];

  readonly filterCategoryOptions: DropdownOption[] = [
    { label: 'All Categories', value: '' },
    ...this.categoryOptions,
  ];

  readonly filterPriorityOptions: DropdownOption[] = [
    { label: 'All Priorities', value: '' },
    { label: 'Urgent',         value: 'urgent'    },
    { label: 'Important',      value: 'important' },
    { label: 'Normal',         value: 'normal'    },
  ];
  showForm       = false;

  totalNotices = 0;
  pinnedCount  = 0;
  urgentCount  = 0;
  expiredCount = 0;

  form = this.emptyForm();

  constructor(private readonly noticeService: NoticeService) {}

  ngOnInit(): void {
    this.noticeService.refresh();
    this.noticeService.getNotices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notices => {
        this.allNotices = notices;
        this.computeStats();
        this.applyFilters();
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private computeStats(): void {
    this.totalNotices = this.allNotices.length;
    this.pinnedCount  = this.allNotices.filter(n => n.isPinned).length;
    this.urgentCount  = this.allNotices.filter(n => n.priority === 'urgent').length;
    this.expiredCount = this.allNotices.filter(n => this.isExpired(n)).length;
  }

  applyFilters(): void {
    let result = [...this.allNotices];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    if (this.filterCategory) result = result.filter(n => n.category === this.filterCategory);
    if (this.filterPriority) result = result.filter(n => n.priority === this.filterPriority);
    if (this.showPinnedOnly) result = result.filter(n => n.isPinned);
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    this.filteredNotices = result;
  }

  clearFilters(): void {
    this.searchQuery = this.filterCategory = this.filterPriority = '';
    this.showPinnedOnly = false;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterCategory || this.filterPriority || this.showPinnedOnly);
  }

  togglePinnedOnly(): void { this.showPinnedOnly = !this.showPinnedOnly; this.applyFilters(); }
  toggleForm(): void { this.showForm = !this.showForm; if (!this.showForm) this.form = this.emptyForm(); }
  togglePin(id: string): void { this.noticeService.togglePin(id); }
  deleteNotice(id: string): void { this.noticeService.deleteNotice(id); }

  submitNotice(): void {
    if (!this.form.title.trim() || !this.form.content.trim()) return;
    this.noticeService.addNotice({
      title:    this.form.title.trim(),
      content:  this.form.content.trim(),
      category: this.form.category,
      priority: this.form.priority,
      postedBy: this.form.postedBy.trim() || 'Office Admin',
      isPinned: this.form.isPinned,
      expiresAt: this.form.expiresAt || undefined
    });
    this.showForm = false;
    this.form = this.emptyForm();
  }

  isExpired(n: Notice): boolean {
    if (!n.expiresAt) return false;
    return new Date(n.expiresAt) < new Date(new Date().toDateString());
  }

  getCategoryLabel(cat: string): string {
    return ({ general: 'General', academic: 'Academic', hostel: 'Hostel', maintenance: 'Maintenance', emergency: 'Emergency' } as Record<string, string>)[cat] ?? cat;
  }

  private emptyForm(): { title: string; content: string; category: NoticeCategory; priority: NoticePriority; postedBy: string; isPinned: boolean; expiresAt: string } {
    return { title: '', content: '', category: 'general', priority: 'normal', postedBy: 'Office Admin', isPinned: false, expiresAt: '' };
  }
}
