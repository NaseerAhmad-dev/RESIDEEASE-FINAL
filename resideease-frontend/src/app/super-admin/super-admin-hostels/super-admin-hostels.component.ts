import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { HostelService, Hostel } from '../../services/hostel.service';
import { DropdownComponent } from '../../components/resuable/dropdown/dropdown.component';

type PanelMode = 'create' | 'edit';

@Component({
  selector: 'app-super-admin-hostels',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, TagModule, InputTextModule, DropdownComponent],
  templateUrl: './super-admin-hostels.component.html',
  styleUrl: './super-admin-hostels.component.scss'
})
export class SuperAdminHostelsComponent implements OnInit {
  private readonly hostelService = inject(HostelService);
  private readonly fb            = inject(FormBuilder);
  private readonly router        = inject(Router);

  @ViewChild('dt') dt!: Table;

  hostels: Hostel[] = [];
  loading  = true;
  saving   = false;
  errorMsg = '';

  searchValue    = '';
  selectedStatus: boolean | null = null;

  statusOptions = [
    { label: 'Active',   value: true  },
    { label: 'Inactive', value: false },
  ];

  hostelTypeOptions = [
    { label: 'Mixed',  value: 'mixed'  },
    { label: 'Boys',   value: 'boys'   },
    { label: 'Girls',  value: 'girls'  },
  ];

  messTypeOptions = [
    { label: 'Veg',     value: 'veg'     },
    { label: 'Non-Veg', value: 'non-veg' },
    { label: 'Both',    value: 'both'    },
  ];

  panelOpen = signal(false);
  panelMode = signal<PanelMode>('create');
  editingId: string | null = null;

  deleteTargetId   = '';
  deleteTargetName = '';
  deleting         = false;

  hostelForm = this.fb.group({
    // Core
    name:        ['', Validators.required],
    hostelType:  ['mixed'],
    // Location
    addressLine1: [''],
    city:          [''],
    state:         [''],
    pincode:       [''],
    latitude:      [null as number | null],
    longitude:     [null as number | null],
    // Settings
    website:     [''],
    description: [''],
    totalSeats:  [null as number | null],
    hasMess:     [false],
    messType:    [''],
    // Admin credentials
    adminName:     [''],
    adminEmail:    ['', [Validators.required, Validators.email]],
    adminPassword: ['', Validators.required],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.hostelService.listHostels().subscribe({
      next: res  => { this.hostels = res.data; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  onSearch(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onStatusFilter(value: boolean | null): void {
    value !== null
      ? this.dt.filter(value, 'isActive', 'equals')
      : this.dt.filter('', 'isActive', 'equals');
  }

  clearFilters(): void {
    this.searchValue    = '';
    this.selectedStatus = null;
    this.dt.clear();
  }

  openCreate(): void {
    this.hostelForm.reset({ hostelType: 'mixed', hasMess: false });
    this.hostelForm.get('adminEmail')!.setValidators([Validators.required, Validators.email]);
    this.hostelForm.get('adminPassword')!.setValidators(Validators.required);
    this.hostelForm.get('adminEmail')!.updateValueAndValidity();
    this.hostelForm.get('adminPassword')!.updateValueAndValidity();
    this.editingId = null;
    this.errorMsg  = '';
    this.panelMode.set('create');
    this.panelOpen.set(true);
  }

  openEdit(h: Hostel): void {
    const loc = h.location;
    const cfg = h.settings;
    this.hostelForm.reset({
      name:        h.name,
      hostelType:  h.hostelType,
      addressLine1: loc?.addressLine1 ?? '',
      city:          loc?.city        ?? '',
      state:         loc?.state       ?? '',
      pincode:       loc?.pincode     ?? '',
      latitude:      loc?.latitude    ?? null,
      longitude:     loc?.longitude   ?? null,
      website:     cfg?.website     ?? '',
      description: cfg?.description ?? '',
      totalSeats:  cfg?.totalSeats  ?? null,
      hasMess:     cfg?.hasMess     ?? false,
      messType:    cfg?.messType    ?? '',
      adminName: '', adminEmail: '', adminPassword: '',
    });
    this.hostelForm.get('adminEmail')!.clearValidators();
    this.hostelForm.get('adminPassword')!.clearValidators();
    this.hostelForm.get('adminEmail')!.updateValueAndValidity();
    this.hostelForm.get('adminPassword')!.updateValueAndValidity();
    this.editingId = h.id;
    this.errorMsg  = '';
    this.panelMode.set('edit');
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.editingId = null;
    this.errorMsg  = '';
  }

  save(): void {
    if (this.hostelForm.invalid) return;
    this.saving   = true;
    this.errorMsg = '';
    const f = this.hostelForm.value;

    if (this.panelMode() === 'create') {
      const payload = {
        name:       f.name!,
        hostelType: f.hostelType || 'mixed',
        location: {
          addressLine1: f.addressLine1 || undefined,
          city:         f.city        || undefined,
          state:        f.state       || undefined,
          pincode:      f.pincode     || undefined,
          latitude:     f.latitude    ?? undefined,
          longitude:    f.longitude   ?? undefined,
        },
        settings: {
          website:     f.website     || undefined,
          description: f.description || undefined,
          totalSeats:  f.totalSeats  ?? undefined,
          hasMess:     f.hasMess     ?? false,
          messType:    f.messType    || undefined,
        },
        adminEmail:    f.adminEmail!,
        adminPassword: f.adminPassword!,
        adminName:     f.adminName  || undefined,
      };
      this.hostelService.createHostel(payload).subscribe({
        next:  () => { this.saving = false; this.closePanel(); this.load(); },
        error: err => { this.saving = false; this.errorMsg = err.error?.message ?? 'Failed to onboard hostel.'; }
      });
    } else {
      const payload = {
        name:       f.name       || undefined,
        hostelType: f.hostelType || undefined,
        location: {
          addressLine1: f.addressLine1 || undefined,
          city:         f.city        || undefined,
          state:        f.state       || undefined,
          pincode:      f.pincode     || undefined,
          latitude:     f.latitude    ?? undefined,
          longitude:    f.longitude   ?? undefined,
        },
        settings: {
          website:     f.website     || undefined,
          description: f.description || undefined,
          totalSeats:  f.totalSeats  ?? undefined,
          hasMess:     f.hasMess     ?? undefined,
          messType:    f.messType    || undefined,
        },
      };
      this.hostelService.updateHostel(this.editingId!, payload).subscribe({
        next:  () => { this.saving = false; this.closePanel(); this.load(); },
        error: err => { this.saving = false; this.errorMsg = err.error?.message ?? 'Failed to save hostel.'; }
      });
    }
  }

  confirmDelete(h: Hostel): void {
    this.deleteTargetId   = h.id;
    this.deleteTargetName = h.name;
  }

  cancelDelete(): void {
    this.deleteTargetId   = '';
    this.deleteTargetName = '';
  }

  doDelete(): void {
    if (!this.deleteTargetId) return;
    this.deleting = true;
    this.hostelService.deleteHostel(this.deleteTargetId).subscribe({
      next:  () => { this.deleting = false; this.cancelDelete(); this.load(); },
      error: err => { this.deleting = false; alert(err.error?.message ?? 'Failed to delete.'); }
    });
  }

  viewHostel(h: Hostel): void {
    this.router.navigate(['/super-admin/hostels', h.id]);
  }

  primaryOwner(h: Hostel): string {
    return h.owners?.find(o => o.isPrimary)?.email ?? h.owners?.[0]?.email ?? '—';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  severity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
