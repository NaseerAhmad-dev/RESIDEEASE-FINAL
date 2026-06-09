import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MaintenanceRequest, MaintenanceStatus } from '../../models/maintenance-request.model';
import { MaintenanceRequestService } from '../../services/maintenance-request.service';

@Component({
  selector: 'app-maintenance-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maintenance-requests.component.html',
  styleUrl: './maintenance-requests.component.scss'
})
export class MaintenanceRequestsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allRequests:      MaintenanceRequest[] = [];
  filteredRequests: MaintenanceRequest[] = [];

  searchQuery    = '';
  filterStatus   = '';
  filterCategory = '';
  filterPriority = '';
  sortField: 'raisedAt' | 'priority' | 'status' = 'raisedAt';
  sortDir: 'asc' | 'desc' = 'desc';

  totalCount    = 0;
  openCount     = 0;
  inProgressCount = 0;
  resolvedCount = 0;

  constructor(private readonly maintenanceService: MaintenanceRequestService) {}

  ngOnInit(): void {
    this.maintenanceService.getRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe(reqs => {
        this.allRequests = reqs;
        this.computeStats(reqs);
        this.applyFilters();
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private computeStats(reqs: MaintenanceRequest[]): void {
    this.totalCount     = reqs.length;
    this.openCount      = reqs.filter(r => r.status === 'open').length;
    this.inProgressCount = reqs.filter(r => r.status === 'in-progress').length;
    this.resolvedCount  = reqs.filter(r => r.status === 'resolved' || r.status === 'closed').length;
  }

  applyFilters(): void {
    let result = [...this.allRequests];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(r =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q)  ||
        r.ticketNumber.toLowerCase().includes(q)||
        r.roomNumber.toLowerCase().includes(q)  ||
        r.title.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus)   result = result.filter(r => r.status === this.filterStatus);
    if (this.filterCategory) result = result.filter(r => r.category === this.filterCategory);
    if (this.filterPriority) result = result.filter(r => r.priority === this.filterPriority);
    this.filteredRequests = this.sortRequests(result);
  }

  private priorityRank(p: string): number {
    return { urgent: 4, high: 3, medium: 2, low: 1 }[p] ?? 0;
  }

  private sortRequests(list: MaintenanceRequest[]): MaintenanceRequest[] {
    return [...list].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (this.sortField) {
        case 'priority': va = this.priorityRank(a.priority); vb = this.priorityRank(b.priority); break;
        case 'status':   va = a.status; vb = b.status; break;
        default:         va = a.raisedAt; vb = b.raisedAt; break;
      }
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }

  setSort(field: typeof this.sortField): void {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortField = field; this.sortDir = 'desc'; }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = this.filterStatus = this.filterCategory = this.filterPriority = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterStatus || this.filterCategory || this.filterPriority);
  }

  updateStatus(id: string, status: MaintenanceStatus): void {
    this.maintenanceService.updateStatus(id, status);
  }

  getSortIcon(field: typeof this.sortField): string {
    if (this.sortField !== field) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  categoryLabel(cat: string): string {
    const map: Record<string, string> = {
      plumbing: 'Plumbing', electrical: 'Electrical', carpentry: 'Carpentry',
      cleaning: 'Cleaning', appliance: 'Appliance', other: 'Other'
    };
    return map[cat] ?? cat;
  }

  getAvatarColor(name: string): string {
    const colors = ['#0ea5e9','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444','#6366f1','#14b8a6'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
