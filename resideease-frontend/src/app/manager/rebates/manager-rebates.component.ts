import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RebateRequest, RebateStatus } from '../../models/rebate.model';
import { RebateService } from '../../services/rebate.service';

@Component({
  selector: 'app-manager-rebates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-rebates.component.html',
  styleUrl: './manager-rebates.component.scss'
})
export class ManagerRebatesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allRequests: RebateRequest[]      = [];
  filteredRequests: RebateRequest[] = [];

  searchQuery  = '';
  activeFilter: RebateStatus | '' = '';

  total         = 0;
  pendingCount  = 0;
  approvedCount = 0;
  rejectedCount = 0;

  toastMsg  = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly rebateService: RebateService) {}

  ngOnInit(): void {
    this.rebateService.getRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe(requests => {
        this.allRequests = [...requests].sort(
          (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        );
        this.computeStats();
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private computeStats(): void {
    this.total         = this.allRequests.length;
    this.pendingCount  = this.allRequests.filter(r => r.status === 'pending').length;
    this.approvedCount = this.allRequests.filter(r => r.status === 'approved').length;
    this.rejectedCount = this.allRequests.filter(r => r.status === 'rejected').length;
  }

  applyFilters(): void {
    let result = [...this.allRequests];
    if (this.activeFilter) {
      result = result.filter(r => r.status === this.activeFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(r =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q)
      );
    }
    this.filteredRequests = result;
  }

  setFilter(filter: RebateStatus | ''): void {
    this.activeFilter = filter;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery  = '';
    this.activeFilter = '';
    this.applyFilters();
  }

  approve(id: string): void {
    this.rebateService.approveRequest(id, 'Mess Manager');
    this.showToast('Rebate approved successfully.', 'success');
  }

  reject(id: string): void {
    this.rebateService.rejectRequest(id, 'Mess Manager');
    this.showToast('Rebate request rejected.', 'error');
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg  = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMsg = ''), 3000);
  }
}
