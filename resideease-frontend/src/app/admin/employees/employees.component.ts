import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule, Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { EmployeeService, Employee } from '../../services/employee.service';
import { DropdownComponent } from '../../components/resuable/dropdown/dropdown.component';

type PanelMode = 'create' | 'edit';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, TagModule, DropdownComponent],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss',
})
export class EmployeesComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly fb              = inject(FormBuilder);

  @ViewChild('dt') dt!: Table;

  employees: Employee[] = [];
  loading   = true;
  saving    = false;
  deleting  = false;
  errorMsg  = '';

  searchValue    = '';
  selectedStatus: string | null = null;

  panelOpen = signal(false);
  panelMode = signal<PanelMode>('create');
  editingId: string | null = null;

  deleteTargetId   = '';
  deleteTargetName = '';
  showDeleteConfirm = false;

  readonly statusOptions = [
    { label: 'Active',   value: 'active'    },
    { label: 'Inactive', value: 'inactive'  },
    { label: 'On Leave', value: 'on_leave'  },
  ];

  readonly roleOptions = [
    { label: 'Staff (no login)',  value: 'staff'         },
    { label: 'Mess Manager',      value: 'mess_manager'  },
    { label: 'Warden',            value: 'warden'        },
    { label: 'Accountant',        value: 'accountant'    },
  ];

  readonly departmentOptions = [
    { label: 'Administration', value: 'Administration' },
    { label: 'Mess',           value: 'Mess'           },
    { label: 'Security',       value: 'Security'       },
    { label: 'Housekeeping',   value: 'Housekeeping'   },
    { label: 'Maintenance',    value: 'Maintenance'    },
    { label: 'Accounts',       value: 'Accounts'       },
    { label: 'Other',          value: 'Other'          },
  ];

  readonly filterStatusOptions = [
    { label: 'Active',   value: 'active'   },
    { label: 'Inactive', value: 'inactive' },
    { label: 'On Leave', value: 'on_leave' },
  ];

  form = this.fb.group({
    name:       ['', Validators.required],
    jobTitle:   ['', Validators.required],
    joinDate:   ['', Validators.required],
    email:      [''],
    phone:      [''],
    department: [''],
    salary:     [null as number | null],
    status:     ['active'],
    role:       ['staff'],
    password:   [''],
    address:    [''],
    notes:      [''],
  });

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading = true;
    this.employeeService.getAll().subscribe({
      next:  res => { this.employees = res.data; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  openCreate(): void {
    this.errorMsg = '';
    this.editingId = null;
    this.form.reset({ status: 'active', role: 'staff' });
    this.panelMode.set('create');
    this.panelOpen.set(true);
  }

  openEdit(emp: Employee): void {
    this.errorMsg = '';
    this.editingId = emp.id;
    this.form.reset({
      name:       emp.name,
      jobTitle:   emp.jobTitle,
      joinDate:   emp.joinDate,
      email:      emp.email      ?? '',
      phone:      emp.phone      ?? '',
      department: emp.department ?? '',
      salary:     emp.salary     ?? null,
      status:     emp.status,
      role:       emp.role       || 'staff',
      password:   '',
      address:    emp.address    ?? '',
      notes:      emp.notes      ?? '',
    });
    this.panelMode.set('edit');
    this.panelOpen.set(true);
  }

  closePanel(): void { this.panelOpen.set(false); }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.errorMsg = '';

    const v = this.form.value;
    const payload: any = {
      name:       v.name!,
      jobTitle:   v.jobTitle!,
      joinDate:   v.joinDate!,
      email:      v.email      || null,
      phone:      v.phone      || null,
      department: v.department || null,
      salary:     v.salary     ?? null,
      status:     v.status     || 'active',
      role:       v.role       || 'staff',
      address:    v.address    || null,
      notes:      v.notes      || null,
    };
    if (v.password) payload.password = v.password;

    const call = this.panelMode() === 'create'
      ? this.employeeService.create(payload)
      : this.employeeService.update(this.editingId!, payload);

    call.subscribe({
      next: res => {
        if (this.panelMode() === 'create') {
          this.employees = [res.data, ...this.employees];
        } else {
          this.employees = this.employees.map(e => e.id === this.editingId ? res.data : e);
        }
        this.saving = false;
        this.panelOpen.set(false);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Failed to save employee.';
        this.saving = false;
      },
    });
  }

  confirmDelete(emp: Employee): void {
    this.deleteTargetId   = emp.id;
    this.deleteTargetName = emp.name;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void { this.showDeleteConfirm = false; }

  doDelete(): void {
    if (!this.deleteTargetId || this.deleting) return;
    this.deleting = true;
    this.employeeService.remove(this.deleteTargetId).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e.id !== this.deleteTargetId);
        this.deleting = false;
        this.showDeleteConfirm = false;
      },
      error: () => { this.deleting = false; },
    });
  }

  onSearch(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onStatusFilter(value: string | null): void {
    this.selectedStatus = value;
    this.dt.filter(value ?? '', 'status', value ? 'equals' : 'contains');
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedStatus = null;
    this.dt.clear();
  }

  statusSeverity(status: string): 'success' | 'warning' | 'danger' | 'secondary' {
    if (status === 'active')   return 'success';
    if (status === 'on_leave') return 'warning';
    return 'secondary';
  }

  statusLabel(status: string): string {
    if (status === 'active')   return 'Active';
    if (status === 'inactive') return 'Inactive';
    if (status === 'on_leave') return 'On Leave';
    return status;
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
