import {
  Component, ElementRef, EventEmitter, HostListener,
  Input, Output, signal, inject,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { SettingsService } from '../../../services/settings.service';
import { ThemeService } from '../../../services/theme.service';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

export interface ShellNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  @Input() navItems: NavItem[] = [];
  @Input() bottomNav: NavItem[] = [];
  @Input() notifications: ShellNotification[] = [];
  @Input() unreadCount = 0;
  @Input() searchPlaceholder = 'Search...';
  @Input() settingsRoute = '/settings';
  @Input() noticesRoute: string | null = null;

  @Output() markReadEvent    = new EventEmitter<string>();
  @Output() markAllReadEvent = new EventEmitter<void>();

  private readonly router          = inject(Router);
  private readonly elRef           = inject(ElementRef);
  private readonly authService     = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  readonly themeService            = inject(ThemeService);

  get userName():    string { return this.authService.getUser()?.name || 'User'; }
  get userInitial(): string { return this.userName[0].toUpperCase(); }
  get hostelName():  string { return this.settingsService.getSettings()().hostel.name || 'My Hostel'; }
  get userRole(): string {
    const role = this.authService.getUser()?.role || 'staff';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  sidebarOpen = signal(true);
  notifOpen   = signal(false);
  profileOpen = signal(false);

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }

  toggleNotif(event: Event): void {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.notifOpen.update(v => !v);
  }

  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.notifOpen.set(false);
    this.profileOpen.update(v => !v);
  }

  stopProp(event: Event): void { event.stopPropagation(); }

  markRead(id: string): void { this.markReadEvent.emit(id); }
  markAllRead(): void        { this.markAllReadEvent.emit(); }

  signOut(): void {
    this.authService.clearSession();
    this.router.navigate(['/']);
  }

  timeAgo(iso: string): string {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.notifOpen.set(false);
      this.profileOpen.set(false);
    }
  }
}
