import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { Room } from '../../models/room.model';
import { RoomService } from '../../services/room.service';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student.model';

export interface RoomCard extends Room {
  occupancy: number;
  occupancyState: 'available' | 'partial' | 'full' | 'maintenance';
}

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.scss'
})
export class RoomsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allRooms: RoomCard[] = [];
  filteredRooms: RoomCard[] = [];
  floors: number[] = [];

  searchQuery  = '';
  filterType   = '';
  filterFloor  = '';
  filterStatus = '';

  totalRooms      = 0;
  availableRooms  = 0;
  partialRooms    = 0;
  fullRooms       = 0;
  maintenanceRooms = 0;

  constructor(
    private readonly roomService: RoomService,
    private readonly studentService: StudentService
  ) {}

  ngOnInit(): void {
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
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private buildCards(rooms: Room[], students: Student[]): RoomCard[] {
    return rooms.map(room => {
      const occupancy = students.filter(s =>
        s.roomNumber === room.roomNumber &&
        (s.status === 'active' || s.status === 'pending')
      ).length;

      let occupancyState: RoomCard['occupancyState'];
      if (room.status === 'maintenance')    occupancyState = 'maintenance';
      else if (occupancy >= room.capacity)  occupancyState = 'full';
      else if (occupancy > 0)              occupancyState = 'partial';
      else                                  occupancyState = 'available';

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
    return { single: 'Single', double: 'Double', triple: 'Triple' }[type] ?? type;
  }

  getOccupancyDots(room: RoomCard): boolean[] {
    return Array.from({ length: room.capacity }, (_, i) => i < room.occupancy);
  }

  getOccupancyLabel(state: RoomCard['occupancyState']): string {
    return { available: 'Available', partial: 'Partial', full: 'Full', maintenance: 'Maintenance' }[state];
  }
}
