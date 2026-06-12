import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

interface KpiCard  { label: string; value: string; sub: string; color: string; }
interface PersonRow { id: string; name: string; room: string; avatar: string; }
interface StudentRow { id: string; name: string; room: string; plan: string; status: string; avatar: string; }
interface RoomOccRow { type: string; label: string; total: number; totalCapacity: number; occupied: number; pct: number; }
interface MessRow   { meal: string; count: number; total: number; pct: number; time: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  today     = new Date();
  isLoading = true;
  hasError  = false;

  kpis:           KpiCard[]    = [];
  checkOuts:      PersonRow[]  = [];
  checkIns:       PersonRow[]  = [];
  recentStudents: StudentRow[] = [];
  roomOccupancy:  RoomOccRow[] = [];
  messStats:      MessRow[]    = [];

  quickStats = {
    totalResidents: 0, newThisMonth: 0,
    totalRevenue: 0, messAttendancePct: 0,
    openMaintenance: 0, urgentMaintenance: 0,
  };
  overallOccupancyPct = 0;
  upcomingThisWeek    = 0;

  private readonly ROOM_LABELS: Record<string, string> = {
    single: 'Single rooms',
    double: 'Double sharing',
    triple: 'Triple sharing',
    suite:  'Suite rooms',
  };

  private readonly PLAN_LABELS: Record<string, string> = {
    lunch:             'Lunch',
    dinner:            'Dinner',
    both:              'Full Mess',
    'no-mess':         'No Mess',
    'full-board':      'Full Board',
    'half-board':      'Half Board',
    'breakfast-only':  'Breakfast Only',
  };

  ngOnInit(): void { this.loadStats(); }

  reload(): void { this.loadStats(); }

  private loadStats(): void {
    this.isLoading = true;
    this.hasError  = false;

    this.dashboardService.getStats().subscribe({
      next: s => {
        const totalBeds = s.kpis.totalBeds;
        const occupied  = s.kpis.occupied;
        const occPct    = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;
        const vacPct    = 100 - occPct;

        this.kpis = [
          { label: 'Total beds',    value: totalBeds.toLocaleString(),          sub: 'Total bed capacity',                              color: 'brand'  },
          { label: 'Occupied beds', value: occupied.toLocaleString(),            sub: `${occPct}% occupancy rate`,                       color: 'green'  },
          { label: 'Vacant beds',   value: s.kpis.vacant.toLocaleString(),      sub: `${vacPct}% beds available`,                       color: 'amber'  },
          { label: 'Total rooms',   value: s.kpis.totalRooms.toLocaleString(),  sub: 'Across all floors',                               color: 'purple' },
          { label: 'Vacant rooms',  value: s.kpis.vacantRooms.toLocaleString(), sub: `${s.kpis.vacantRoomsPct}% available now`,         color: 'sky'    },
          { label: 'Pending dues',  value: this.fmtMoney(s.kpis.pendingDuesAmount), sub: `${s.kpis.pendingDuesCount} boarders overdue`, color: 'danger' },
        ];

        this.quickStats          = s.quickStats;
        this.overallOccupancyPct = s.overallOccupancyPct;
        this.upcomingThisWeek    = s.upcomingThisWeek;
        this.checkOuts           = s.todayCheckOuts;
        this.checkIns            = s.todayCheckIns;

        this.recentStudents = s.recentStudents.map(r => ({
          ...r, plan: this.PLAN_LABELS[r.plan] ?? r.plan,
        }));

        this.roomOccupancy = s.roomOccupancy.map(r => ({
          ...r, label: this.ROOM_LABELS[r.type] ?? r.type,
        }));

        const total    = s.messToday.totalStudents;
        const lunchPct  = total > 0 ? Math.round((s.messToday.lunch  / total) * 100) : 0;
        const dinnerPct = total > 0 ? Math.round((s.messToday.dinner / total) * 100) : 0;
        this.messStats = [
          { meal: 'Lunch',  count: s.messToday.lunch,  total, pct: lunchPct,  time: '12–2 PM' },
          { meal: 'Dinner', count: s.messToday.dinner, total, pct: dinnerPct, time: '7–9 PM'  },
        ];

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError  = true;
      },
    });
  }

  fmtMoney(amount: number): string {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000)   return `₹${Math.round(amount / 1000)}K`;
    return `₹${amount}`;
  }
}
