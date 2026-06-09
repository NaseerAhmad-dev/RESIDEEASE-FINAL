import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { EmployeeService } from '../../services/employee.service';

interface NotifPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-manager-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-settings.component.html',
  styleUrl: './manager-settings.component.scss'
})
export class ManagerSettingsComponent implements OnInit {
  private readonly authService     = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly employeeService = inject(EmployeeService);

  activeTab: 'profile' | 'security' | 'notifications' = 'profile';

  private get sessionUser() { return this.authService.getUser(); }

  profile = {
    name:   '',
    hostel: '',
    email:  '',
    phone:  '',
  };

  get userRole(): string {
    const role = this.sessionUser?.role || 'manager';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  passwordForm = { current: '', newPass: '', confirm: '' };
  passwordError   = '';
  passwordSuccess = false;

  showCurrent = false;
  showNew     = false;
  showConfirm = false;

  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';
  saveError = '';

  notifPrefs: NotifPref[] = [
    { id: 'meal_service',   label: 'Meal service alerts',    description: 'Notify when meal service starts or ends for the day',       enabled: true  },
    { id: 'new_enrollment', label: 'New enrollments',        description: 'Alert when students enroll for meals',                      enabled: true  },
    { id: 'rebate_request', label: 'Rebate requests',        description: 'Alert for new rebate applications awaiting your review',    enabled: true  },
    { id: 'coupon_summary', label: 'Daily coupon summary',   description: 'End-of-day summary of coupon validations',                  enabled: false },
    { id: 'low_enrollment', label: 'Low enrollment warning', description: 'Alert when enrollment drops below the expected threshold',  enabled: true  },
    { id: 'admin_notices',  label: 'Admin notices',          description: 'Notify when the admin posts a new hostel notice',           enabled: false },
  ];

  ngOnInit(): void {
    const user = this.sessionUser;
    this.profile.name   = user?.name  || '';
    this.profile.email  = user?.email || '';
    this.profile.hostel = this.settingsService.getSettings()().hostel.name || '';

    // Fetch full employee record to get phone
    if (user?.id) {
      this.employeeService.getById(user.id).subscribe({
        next: res => {
          this.profile.phone  = res.data.phone  || '';
          this.profile.name   = res.data.name   || this.profile.name;
          this.profile.email  = res.data.email  || this.profile.email;
          this.profile.hostel = this.settingsService.getSettings()().hostel.name || '';
        },
        error: () => {},
      });
    }
  }

  saveProfile(): void {
    const user = this.sessionUser;
    if (!user?.id) return;

    this.saveStatus = 'saving';
    this.saveError  = '';

    this.employeeService.update(user.id, {
      name:  this.profile.name,
      email: this.profile.email || null,
      phone: this.profile.phone || null,
    }).subscribe({
      next: res => {
        // Update the stored session name so the shell reflects the change
        this.authService.saveSession(
          this.authService.getToken()!,
          { ...user, name: res.data.name, email: res.data.email }
        );
        this.saveStatus = 'success';
        setTimeout(() => (this.saveStatus = 'idle'), 3000);
      },
      error: (err) => {
        this.saveError  = err?.error?.message || 'Failed to save changes.';
        this.saveStatus = 'error';
        setTimeout(() => (this.saveStatus = 'idle'), 3000);
      },
    });
  }

  changePassword(): void {
    this.passwordError   = '';
    this.passwordSuccess = false;
    if (!this.passwordForm.current)              { this.passwordError = 'Enter your current password.'; return; }
    if (this.passwordForm.newPass.length < 8)    { this.passwordError = 'New password must be at least 8 characters.'; return; }
    if (this.passwordForm.newPass !== this.passwordForm.confirm) { this.passwordError = 'Passwords do not match.'; return; }

    const user = this.sessionUser;
    if (!user?.id) return;

    this.employeeService.update(user.id, { password: this.passwordForm.newPass }).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.passwordForm    = { current: '', newPass: '', confirm: '' };
        setTimeout(() => (this.passwordSuccess = false), 3500);
      },
      error: (err) => {
        this.passwordError = err?.error?.message || 'Failed to update password.';
      },
    });
  }

  togglePref(pref: NotifPref): void { pref.enabled = !pref.enabled; }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  }
}
