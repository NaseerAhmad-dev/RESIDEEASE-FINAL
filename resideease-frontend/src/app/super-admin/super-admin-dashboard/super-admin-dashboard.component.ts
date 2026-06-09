import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HostelService, Hostel } from '../../services/hostel.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss'
})
export class SuperAdminDashboardComponent implements OnInit {
  private readonly hostelService = inject(HostelService);
  private readonly authService  = inject(AuthService);

  userName = 'Super Admin';
  hostels: Hostel[] = [];
  loading = true;

  get totalHostels(): number   { return this.hostels.length; }
  get activeHostels(): number   { return this.hostels.filter(h =>  h.isActive).length; }
  get inactiveHostels(): number { return this.hostels.filter(h => !h.isActive).length; }
  get recentHostels(): Hostel[] { return this.hostels.slice(0, 5); }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.name) this.userName = user.name;

    this.hostelService.listHostels().subscribe({
      next: res => { this.hostels = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
