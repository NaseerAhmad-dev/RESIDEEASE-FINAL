import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessService } from '../services/mess.service';
import { MessStats } from '../models/mess.model';
import { DashboardService, DashboardStats } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService      = inject(AuthService);
  private readonly settingsService  = inject(SettingsService);
  private readonly messService      = inject(MessService);

  managerName = this.authService.getUser()?.name || 'Manager';
  hostelName  = this.settingsService.getSettings()().hostel.name || 'Your Hostel';

  messStats: MessStats = { totalSubscribed: 0, totalServed: 0, pendingStudents: 0, todayDate: '' };

  dashboardStats: DashboardStats | null = null;
  loading = true;

  get stats() {
    const d = this.dashboardStats;
    return [
      { title: 'Active residents', value: d ? String(d.quickStats.totalResidents) : '—', subtitle: 'Currently staying',   accent: 'brand' },
      { title: 'Pending dues',     value: d ? String(d.kpis.pendingDuesCount)     : '—', subtitle: 'Awaiting payment',    accent: 'amber' },
      { title: 'Open tasks',       value: d ? String(d.quickStats.openMaintenance): '—', subtitle: 'Maintenance tickets', accent: 'green' },
      { title: 'Rooms available',  value: d ? String(d.kpis.vacant)               : '—', subtitle: 'Ready for occupancy', accent: 'sky'   },
    ];
  }

  get maintenanceNote(): string {
    const d = this.dashboardStats;
    if (!d) return '';
    const urgent = d.quickStats.urgentMaintenance;
    const low    = d.quickStats.openMaintenance - urgent;
    return `${urgent} high priority · ${low} low priority`;
  }

  ngOnInit(): void {
    this.messStats = this.messService.getTodayStats();

    this.dashboardService.getStats().subscribe({
      next: stats => {
        this.dashboardStats = stats;
        this.loading = false;
        this.hostelName = this.settingsService.getSettings()().hostel.name || this.hostelName;
      },
      error: () => { this.loading = false; },
    });

    this.messService.getEnrollments().subscribe(() => {
      this.messStats = this.messService.getTodayStats();
    });
  }
}
