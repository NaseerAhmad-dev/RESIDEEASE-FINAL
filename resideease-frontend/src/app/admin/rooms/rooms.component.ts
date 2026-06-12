import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { Room, RoomType, AMENITY_POOL, ROOM_AMENITIES, ROOM_PRICE, ROOM_CAPACITY } from '../../models/room.model';
import { RoomService } from '../../services/room.service';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student.model';

export interface RoomCard extends Room {
  occupancy: number;
  occupancyState: 'available' | 'partial' | 'full' | 'maintenance';
}

export interface ImportRow {
  roomNumber: string;
  floor: number;
  type: string;
  capacity: number;
  price: number;
  status: string;
  amenities: string[];
  _valid: boolean;
  _errors: string[];
}

const CSV_HEADERS = ['roomNumber', 'floor', 'type', 'capacity', 'price', 'status', 'amenities'];

const CSV_TEMPLATE = [
  CSV_HEADERS.join(','),
  '101,1,single,1,8000,active,Private Bathroom|Study Desk|Wardrobe|AC',
  '102,1,double,2,5500,active,Shared Bathroom|Study Desks x2|Wardrobes x2|AC',
  '103,1,triple,3,3800,active,Shared Bathroom|Study Desks x3|Lockers x3|Fan',
  '201,2,single,1,8000,active,Private Bathroom|Study Desk|Wardrobe|AC',
  '202,2,double,2,5500,maintenance,Shared Bathroom|Study Desks x2|Wardrobes x2|Fan',
].join('\r\n');

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);
  private readonly roomService = inject(RoomService);
  private readonly studentService = inject(StudentService);

  // ── List state ─────────────────────────────────────────────
  allRooms: RoomCard[] = [];
  filteredRooms: RoomCard[] = [];
  floors: number[] = [];

  searchQuery  = '';
  filterType   = '';
  filterFloor  = '';
  filterStatus = '';

  totalRooms       = 0;
  availableRooms   = 0;
  partialRooms     = 0;
  fullRooms        = 0;
  maintenanceRooms = 0;

  // ── Add Room drawer ─────────────────────────────────────────
  showAddDrawer      = false;
  addLoading         = false;
  addError           = '';
  roomForm!: FormGroup;
  bedPreview: string[]        = [];
  selectedAmenities: string[] = [];
  customAmenity               = '';
  readonly roomTypes    = ['single', 'double', 'triple'];
  readonly amenityPool  = AMENITY_POOL;

  get customSelectedAmenities(): string[] {
    return this.selectedAmenities.filter(a => !(AMENITY_POOL as readonly string[]).includes(a));
  }

  // ── Import modal ────────────────────────────────────────────
  showImportModal  = false;
  importRows: ImportRow[] = [];
  importLoading    = false;
  importError      = '';
  importResult: { created: number; skipped: number; errors: number } | null = null;

  get validImportRows(): ImportRow[] { return this.importRows.filter(r => r._valid); }
  get invalidImportRows(): ImportRow[] { return this.importRows.filter(r => !r._valid); }

  // ── Lifecycle ───────────────────────────────────────────────
  ngOnInit(): void {
    this.roomService.refresh();

    combineLatest([
      this.roomService.getRooms(),
      this.studentService.getStudents()
    ]).pipe(
      takeUntil(this.destroy$),
      map(([rooms, students]) => this.buildCards(rooms, students))
    ).subscribe(cards => {
      this.allRooms = cards;
      this.floors   = [...new Set(cards.map(r => r.floor))].sort((a, b) => a - b);
      this.computeStats();
      this.applyFilters();
    });

    this.initForm();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Room card helpers ───────────────────────────────────────
  private buildCards(rooms: Room[], students: Student[]): RoomCard[] {
    return rooms.map(room => {
      const occupancy = students.filter(s =>
        s.roomNumber === room.roomNumber &&
        (s.status === 'active' || s.status === 'pending')
      ).length;
      let occupancyState: RoomCard['occupancyState'];
      if (room.status === 'maintenance')   occupancyState = 'maintenance';
      else if (occupancy >= room.capacity) occupancyState = 'full';
      else if (occupancy > 0)             occupancyState = 'partial';
      else                                 occupancyState = 'available';
      return { ...room, occupancy, occupancyState };
    });
  }

  private computeStats(): void {
    this.totalRooms       = this.allRooms.length;
    this.availableRooms   = this.allRooms.filter(r => r.occupancyState === 'available').length;
    this.partialRooms     = this.allRooms.filter(r => r.occupancyState === 'partial').length;
    this.fullRooms        = this.allRooms.filter(r => r.occupancyState === 'full').length;
    this.maintenanceRooms = this.allRooms.filter(r => r.occupancyState === 'maintenance').length;
  }

  applyFilters(): void {
    let result = [...this.allRooms];
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(r => r.roomNumber.toLowerCase().includes(q));
    }
    if (this.filterType)   result = result.filter(r => r.type === this.filterType);
    if (this.filterFloor)  result = result.filter(r => r.floor === +this.filterFloor);
    if (this.filterStatus) result = result.filter(r => r.occupancyState === this.filterStatus);
    this.filteredRooms = result.sort((a, b) =>
      a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })
    );
  }

  clearFilters(): void {
    this.searchQuery = this.filterType = this.filterFloor = this.filterStatus = '';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterType || this.filterFloor || this.filterStatus);
  }

  getTypeLabel(type: string): string {
    return ({ single: 'Single', double: 'Double', triple: 'Triple' } as Record<string,string>)[type] ?? type;
  }

  getOccupancyDots(room: RoomCard): boolean[] {
    return Array.from({ length: room.capacity }, (_, i) => i < room.occupancy);
  }

  getOccupancyLabel(state: RoomCard['occupancyState']): string {
    return ({ available: 'Available', partial: 'Partial', full: 'Full', maintenance: 'Maintenance' })[state];
  }

  // ── Add Room drawer ─────────────────────────────────────────
  private initForm(): void {
    this.roomForm = this.fb.group({
      roomNumber: ['', Validators.required],
      floor:      [1,  [Validators.required, Validators.min(0)]],
      type:       ['double', Validators.required],
      capacity:   [2,  [Validators.required, Validators.min(1), Validators.max(20)]],
      price:      [5500, [Validators.required, Validators.min(1)]],
      status:     ['active', Validators.required],
    });

    this.roomForm.get('type')!.valueChanges.subscribe(t => this.onTypeChange(t));
    this.onTypeChange('double');
  }

  onTypeChange(type: string): void {
    const cap   = ROOM_CAPACITY[type as keyof typeof ROOM_CAPACITY] ?? 2;
    const price = ROOM_PRICE[type as keyof typeof ROOM_PRICE]       ?? 5000;
    this.roomForm.patchValue({ capacity: cap, price }, { emitEvent: false });
    this.rebuildBedPreview(cap);
    this.selectedAmenities = [...(ROOM_AMENITIES[type as keyof typeof ROOM_AMENITIES] ?? [])];
  }

  toggleAmenity(a: string): void {
    const idx = this.selectedAmenities.indexOf(a);
    if (idx === -1) this.selectedAmenities.push(a);
    else this.selectedAmenities.splice(idx, 1);
  }

  isAmenitySelected(a: string): boolean {
    return this.selectedAmenities.includes(a);
  }

  addCustomAmenity(): void {
    const val = this.customAmenity.trim();
    if (val && !this.selectedAmenities.includes(val)) {
      this.selectedAmenities.push(val);
    }
    this.customAmenity = '';
  }

  removeAmenity(a: string): void {
    this.selectedAmenities = this.selectedAmenities.filter(x => x !== a);
  }

  onCapacityChange(): void {
    const cap = parseInt(this.roomForm.get('capacity')!.value, 10);
    if (cap > 0 && cap <= 20) this.rebuildBedPreview(cap);
  }

  private rebuildBedPreview(cap: number): void {
    const letters = 'ABCDEFGHIJKLMNOPQRST';
    this.bedPreview = Array.from({ length: cap }, (_, i) => letters[i] ?? String(i + 1));
  }

  openAddDrawer(): void {
    this.addError      = '';
    this.customAmenity = '';
    this.roomForm.reset({ roomNumber: '', floor: 1, type: 'double', capacity: 2, price: 5500, status: 'active' });
    this.onTypeChange('double');
    this.showAddDrawer = true;
  }

  closeAddDrawer(): void { this.showAddDrawer = false; }

  getFieldError(field: string): string {
    const c = this.roomForm.get(field);
    if (!c?.touched || !c.errors) return '';
    if (c.errors['required'])  return 'Required';
    if (c.errors['min'])       return `Min ${c.errors['min'].min}`;
    if (c.errors['max'])       return `Max ${c.errors['max'].max}`;
    return '';
  }

  submitRoom(): void {
    if (this.roomForm.invalid) { this.roomForm.markAllAsTouched(); return; }
    this.addLoading = true;
    this.addError   = '';
    const { roomNumber, floor, type, capacity, price, status } = this.roomForm.value;
    const amenities = [...this.selectedAmenities];

    this.roomService.createRoom({ roomNumber, floor, type, capacity, price, status, amenities }).subscribe({
      next: () => { this.addLoading = false; this.closeAddDrawer(); },
      error: err => { this.addError = err?.error?.message ?? 'Failed to create room'; this.addLoading = false; },
    });
  }

  // ── Import CSV ──────────────────────────────────────────────
  openImportModal(): void {
    this.importRows   = [];
    this.importError  = '';
    this.importResult = null;
    this.showImportModal = true;
  }

  closeImportModal(): void { this.showImportModal = false; }

  downloadTemplate(): void {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'rooms_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    this.importError  = '';
    this.importResult = null;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = (e.target as FileReader).result as string;
        this.importRows = this.parseCSV(text);
      } catch {
        this.importError = 'Failed to parse CSV file. Please use the template format.';
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  private parseCSV(text: string): ImportRow[] {
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('Empty file');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idxOf   = (h: string) => headers.indexOf(h);

    return lines.slice(1).map((line, i) => {
      const cols   = this.splitCSVLine(line);
      const errors: string[] = [];

      const roomNumber = cols[idxOf('roomnumber')] ?? '';
      const floorRaw   = cols[idxOf('floor')]      ?? '';
      const type       = (cols[idxOf('type')]      ?? '').toLowerCase();
      const capRaw     = cols[idxOf('capacity')]   ?? '';
      const priceRaw   = cols[idxOf('price')]      ?? '';
      const status     = (cols[idxOf('status')]    ?? 'active').toLowerCase();
      const amenRaw    = cols[idxOf('amenities')]  ?? '';

      if (!roomNumber) errors.push('roomNumber is required');
      const floor    = parseInt(floorRaw, 10);
      if (isNaN(floor) || floor < 0) errors.push('floor must be a number >= 0');
      if (!['single','double','triple'].includes(type)) errors.push('type must be single, double, or triple');
      const capacity = parseInt(capRaw, 10);
      if (isNaN(capacity) || capacity < 1) errors.push('capacity must be >= 1');
      const price    = parseFloat(priceRaw);
      if (isNaN(price) || price < 0) errors.push('price must be a number');
      if (!['active','maintenance'].includes(status)) errors.push('status must be active or maintenance');

      const amenities = amenRaw ? amenRaw.split('|').map(a => a.trim()).filter(Boolean) : [];

      return {
        roomNumber, floor: isNaN(floor) ? 0 : floor,
        type, capacity: isNaN(capacity) ? 1 : capacity,
        price: isNaN(price) ? 0 : price,
        status, amenities,
        _valid: errors.length === 0,
        _errors: errors,
      } as ImportRow;
    });
  }

  private splitCSVLine(line: string): string[] {
    const cols: string[] = [];
    let field = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuotes = !inQuotes; }
      else if (c === ',' && !inQuotes) { cols.push(field.trim()); field = ''; }
      else { field += c; }
    }
    cols.push(field.trim());
    return cols;
  }

  confirmImport(): void {
    if (!this.validImportRows.length) return;
    this.importLoading = true;
    this.importError   = '';

    this.roomService.bulkImport(this.validImportRows as Partial<Room>[]).subscribe({
      next: result => {
        this.importLoading = false;
        this.importResult  = {
          created: result.created?.length ?? 0,
          skipped: result.skipped?.length ?? 0,
          errors:  result.errors?.length  ?? 0,
        };
        this.importRows = [];
      },
      error: err => {
        this.importError   = err?.error?.message ?? 'Import failed';
        this.importLoading = false;
      },
    });
  }
}
