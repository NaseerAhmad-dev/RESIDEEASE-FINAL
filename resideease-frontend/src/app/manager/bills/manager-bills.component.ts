import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupplierBill, BillCategory, BillStatus } from '../../models/supplier-bill.model';
import { SupplierBillService } from '../../services/supplier-bill.service';
import { DropdownComponent, DropdownOption } from '../../components/resuable/dropdown/dropdown.component';

@Component({
  selector: 'app-manager-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './manager-bills.component.html',
  styleUrl: './manager-bills.component.scss'
})
export class ManagerBillsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allBills:      SupplierBill[] = [];
  filteredBills: SupplierBill[] = [];

  searchQuery  = '';
  activeFilter: BillStatus | '' = '';

  totalCount   = 0;
  totalAmount  = 0;
  pendingCount = 0;
  paidCount    = 0;

  // Form state
  showForm   = false;
  formErrors: Partial<Record<keyof typeof this.form, string>> = {};
  form = {
    billNumber:   '',
    supplierName: '',
    category:     '' as BillCategory | '',
    amount:       '' as number | '',
    billDate:     '',
    description:  '',
    photoData:    '' as string
  };
  photoPreview: string | null = null;
  photoName    = '';

  // Lightbox
  lightboxSrc: string | null = null;

  // Toast
  toastMsg  = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly categories: DropdownOption[] = [
    { value: '',            label: 'Select category'         },
    { value: 'food',        label: 'Food & Grocery'          },
    { value: 'maintenance', label: 'Maintenance & Repair'    },
    { value: 'utilities',   label: 'Utilities'               },
    { value: 'cleaning',    label: 'Cleaning & Housekeeping' },
    { value: 'furniture',   label: 'Furniture & Equipment'   },
    { value: 'other',       label: 'Other'                   },
  ];

  readonly billStatusOptions: DropdownOption[] = [
    { label: 'Pending',  value: 'pending'  },
    { label: 'Approved', value: 'approved' },
    { label: 'Paid',     value: 'paid'     },
  ];

  constructor(private readonly billService: SupplierBillService) {}

  ngOnInit(): void {
    this.billService.getBills()
      .pipe(takeUntil(this.destroy$))
      .subscribe(bills => {
        this.allBills = bills;
        this.computeStats();
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private computeStats(): void {
    this.totalCount   = this.allBills.length;
    this.totalAmount  = this.allBills.reduce((s, b) => s + b.amount, 0);
    this.pendingCount = this.allBills.filter(b => b.status === 'pending').length;
    this.paidCount    = this.allBills.filter(b => b.status === 'paid').length;
  }

  applyFilters(): void {
    let result = [...this.allBills];
    if (this.activeFilter) result = result.filter(b => b.status === this.activeFilter);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b =>
        b.supplierName.toLowerCase().includes(q) ||
        b.billNumber.toLowerCase().includes(q)   ||
        b.description.toLowerCase().includes(q)
      );
    }
    this.filteredBills = result;
  }

  setFilter(f: BillStatus | ''): void { this.activeFilter = f; this.applyFilters(); }
  clearFilters(): void { this.searchQuery = ''; this.activeFilter = ''; this.applyFilters(); }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image must be under 5 MB.', 'error');
      return;
    }
    this.photoName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.form.photoData = reader.result as string;
      this.photoPreview   = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.form.photoData = '';
    this.photoPreview   = null;
    this.photoName      = '';
  }

  submitBill(): void {
    if (!this.validate()) return;
    this.billService.addBill({
      billNumber:   this.form.billNumber.trim(),
      supplierName: this.form.supplierName.trim(),
      category:     this.form.category as BillCategory,
      amount:       Number(this.form.amount),
      billDate:     this.form.billDate,
      description:  this.form.description.trim(),
      photoData:    this.form.photoData || undefined
    });
    this.resetForm();
    this.showForm = false;
    this.showToast('Bill registered successfully.', 'success');
  }

  private validate(): boolean {
    this.formErrors = {};
    if (!this.form.supplierName.trim()) this.formErrors['supplierName'] = 'Supplier name is required.';
    if (!this.form.billNumber.trim())   this.formErrors['billNumber']   = 'Bill number is required.';
    if (!this.form.category)            this.formErrors['category']     = 'Select a category.';
    if (!this.form.amount || Number(this.form.amount) <= 0) this.formErrors['amount'] = 'Enter a valid amount.';
    if (!this.form.billDate)            this.formErrors['billDate']     = 'Bill date is required.';
    return Object.keys(this.formErrors).length === 0;
  }

  private resetForm(): void {
    this.form = { billNumber: '', supplierName: '', category: '', amount: '', billDate: '', description: '', photoData: '' };
    this.photoPreview = null;
    this.photoName    = '';
    this.formErrors   = {};
  }

  updateStatus(id: string, status: string): void {
    this.billService.updateStatus(id, status as BillStatus);
    this.showToast('Status updated.', 'success');
  }

  deleteBill(id: string): void {
    this.billService.deleteBill(id);
    this.showToast('Bill deleted.', 'success');
  }

  openLightbox(src: string): void  { this.lightboxSrc = src; }
  closeLightbox(): void             { this.lightboxSrc = null; }

  categoryLabel(cat: BillCategory): string {
    return this.categories.find(c => c.value === cat)?.label ?? cat;
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg  = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMsg = ''), 3000);
  }
}
