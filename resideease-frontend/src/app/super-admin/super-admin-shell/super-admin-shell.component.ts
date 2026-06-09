import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-super-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './super-admin-shell.component.html',
  styleUrl: './super-admin-shell.component.scss'
})
export class SuperAdminShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  sidebarOpen = signal(true);
  notifOpen   = signal(false);
  profileOpen = signal(false);

  userName = 'Super Admin';
  userInitial = 'S';

  navItems: NavItem[] = [
    { label: 'Overview',        route: '/super-admin/dashboard', icon: 'grid'    },
    { label: 'Manage Hostels',  route: '/super-admin/hostels',   icon: 'hostel'  },
  ];

  bottomNav: NavItem[] = [];

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.name) {
      this.userName = user.name;
      this.userInitial = user.name.charAt(0).toUpperCase();
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.notifOpen.set(false);
    this.profileOpen.set(false);
  }

  stopProp(event: Event): void {
    event.stopPropagation();
  }

  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.set(!this.profileOpen());
    this.notifOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  signOut(): void {
    this.authService.clearSession();
    this.router.navigate(['/login']);
  }
}
