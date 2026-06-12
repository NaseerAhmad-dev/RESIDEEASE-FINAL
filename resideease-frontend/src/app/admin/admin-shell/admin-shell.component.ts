import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { AppShellComponent, NavItem, ShellNotification } from '../../shared/components/app-shell/app-shell.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent implements OnInit {
  private readonly http            = inject(HttpClient);
  private readonly authService     = inject(AuthService);
  readonly notificationService     = inject(NotificationService);

  get notifications(): ShellNotification[] { return this.notificationService.notifications(); }
  get unreadCount(): number { return this.notificationService.unreadCount(); }

  navItems: NavItem[] = [
    { label: 'Overview',  route: '/admin/dashboard', icon: 'grid'      },
    { label: 'Boarders',  route: '/admin/students',  icon: 'users'     },
    { label: 'Rooms',     route: '/admin/rooms',     icon: 'door'      },
    { label: 'Employees', route: '/admin/employees', icon: 'briefcase' },
    { label: 'Mess',      route: '/admin/mess',      icon: 'fork'      },
    { label: 'Payments',  route: '/admin/payments',  icon: 'credit'    },
    { label: 'Notices',   route: '/admin/notices',   icon: 'bell'      },
    { label: 'Requests',  route: '/admin/requests',  icon: 'wrench'    },
  ];

  bottomNav: NavItem[] = [
    { label: 'Settings', route: '/admin/settings', icon: 'gear' },
  ];

  ngOnInit(): void {
    this.notificationService.load();
    this.loadBadgeCounts();
  }

  onMarkRead(id: string): void { this.notificationService.markRead(id); }
  onMarkAllRead(): void        { this.notificationService.markAllRead(); }

  private loadBadgeCounts(): void {
    const token = this.authService.getToken();
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${environment.apiUrl}/dashboard/counts`, { headers }).subscribe({
      next: res => {
        if (!res.success) return;
        this.navItems = this.navItems.map(n => {
          if (n.route === '/admin/students')
            return { ...n, badge: res.data.pendingStudents || undefined };
          if (n.route === '/admin/payments')
            return { ...n, badge: res.data.overduePayments || undefined };
          return n;
        });
      },
      error: () => {},
    });
  }
}
