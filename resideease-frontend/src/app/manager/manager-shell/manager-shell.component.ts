import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { MessService } from '../../services/mess.service';
import { AppShellComponent, NavItem, ShellNotification } from '../../shared/components/app-shell/app-shell.component';

@Component({
  selector: 'app-manager-shell',
  standalone: true,
  imports: [AppShellComponent],
  templateUrl: './manager-shell.component.html',
  styleUrl: './manager-shell.component.scss',
})
export class ManagerShellComponent implements OnInit, OnDestroy {
  private readonly messService = inject(MessService);

  notifications: ShellNotification[] = [];
  private sub?: Subscription;

  get unreadCount(): number { return this.notifications.filter(n => !n.isRead).length; }

  navItems: NavItem[] = [
    { label: 'Overview', route: '/manager/dashboard', icon: 'grid'   },
    { label: 'Mess',     route: '/manager/mess',      icon: 'fork'   },
    { label: 'Rebates',  route: '/manager/rebates',   icon: 'rebate' },
    { label: 'Bills',    route: '/manager/bills',     icon: 'bill'   },
    { label: 'Notices',  route: '/manager/notices',   icon: 'bell'   },
    { label: 'Audit',    route: '/manager/audit',     icon: 'audit'  },
  ];

  bottomNav: NavItem[] = [
    { label: 'Settings', route: '/manager/settings', icon: 'gear' },
  ];

  ngOnInit(): void {
    this.sub = this.messService.getNotifications().subscribe(n => {
      this.notifications = n.slice(0, 6);
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  onMarkRead(id: string): void { this.messService.markNotificationAsRead(id); }
}
