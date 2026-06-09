import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, StaffUser } from '../../services/user.service';

type PanelMode = 'create' | 'edit';

@Component({
  selector: 'app-super-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './super-admin-users.component.html',
  styleUrl: './super-admin-users.component.scss'
})
export class SuperAdminUsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  users: StaffUser[] = [];
  loading = true;
  saving = false;
  errorMsg = '';

  panelOpen = signal(false);
  panelMode = signal<PanelMode>('create');
  editingId: string | null = null;

  deleteTargetId: string | null = null;
  deleteTargetName = '';
  deleting = false;

  userForm = this.fb.group({
    name:     [''],
    username: ['', Validators.required],
    email:    ['', Validators.email],
    password: [''],
    role:     ['admin', Validators.required],
  });

  readonly roles = [
    { value: 'admin',   label: 'Admin',   desc: 'Full system access' },
    { value: 'manager', label: 'Manager', desc: 'Mess, rebates, bills, audit' },
    { value: 'office',  label: 'Office',  desc: 'Rooms and student records' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.listUsers().subscribe({
      next: res => { this.users = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCreate(): void {
    this.userForm.reset({ role: 'admin' });
    this.userForm.get('password')!.setValidators(Validators.required);
    this.userForm.get('password')!.updateValueAndValidity();
    this.editingId = null;
    this.errorMsg = '';
    this.panelMode.set('create');
    this.panelOpen.set(true);
  }

  openEdit(user: StaffUser): void {
    this.userForm.reset({
      name:     user.name ?? '',
      username: user.username,
      email:    user.email ?? '',
      password: '',
      role:     user.role,
    });
    this.userForm.get('password')!.clearValidators();
    this.userForm.get('password')!.updateValueAndValidity();
    this.editingId = user.id;
    this.errorMsg = '';
    this.panelMode.set('edit');
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.editingId = null;
    this.errorMsg = '';
  }

  save(): void {
    if (this.userForm.invalid) return;
    this.saving = true;
    this.errorMsg = '';

    const { name, username, email, password, role } = this.userForm.value;

    if (this.panelMode() === 'create') {
      this.userService.createUser({ name: name || undefined, username: username!, email: email || undefined, password: password!, role: role! }).subscribe({
        next: () => { this.saving = false; this.closePanel(); this.loadUsers(); },
        error: err => { this.saving = false; this.errorMsg = err.error?.message ?? 'Failed to create user.'; }
      });
    } else {
      const payload: any = { name, username, email: email || null, role };
      if (password) payload.password = password;

      this.userService.updateUser(this.editingId!, payload).subscribe({
        next: () => { this.saving = false; this.closePanel(); this.loadUsers(); },
        error: err => { this.saving = false; this.errorMsg = err.error?.message ?? 'Failed to update user.'; }
      });
    }
  }

  confirmDelete(user: StaffUser): void {
    this.deleteTargetId = user.id;
    this.deleteTargetName = user.name || user.username;
  }

  cancelDelete(): void {
    this.deleteTargetId = null;
    this.deleteTargetName = '';
  }

  deleteUser(): void {
    if (!this.deleteTargetId) return;
    this.deleting = true;
    this.userService.deleteUser(this.deleteTargetId).subscribe({
      next: () => { this.deleting = false; this.cancelDelete(); this.loadUsers(); },
      error: err => { this.deleting = false; alert(err.error?.message ?? 'Failed to delete user.'); }
    });
  }

  initials(user: StaffUser): string {
    return (user.name || user.username).charAt(0).toUpperCase();
  }

  displayName(user: StaffUser): string {
    return user.name || user.username;
  }

  roleLabel(role: string): string {
    return this.roles.find(r => r.value === role)?.label ?? role;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
