export type RoomType   = 'single' | 'double' | 'triple';
export type RoomStatus = 'active' | 'maintenance';

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  price: number;
  status: RoomStatus;
  amenities: string[];
  createdAt: string;
}

export const ROOM_AMENITIES: Record<RoomType, string[]> = {
  single: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'],
  double: ['Shared Bathroom', 'Study Desks ×2', 'Wardrobes ×2', 'AC'],
  triple: ['Shared Bathroom', 'Study Desks ×3', 'Lockers ×3', 'Fan']
};

export const ROOM_PRICE: Record<RoomType, number> = {
  single: 8000,
  double: 5500,
  triple: 3800
};

export const ROOM_CAPACITY: Record<RoomType, number> = {
  single: 1,
  double: 2,
  triple: 3
};
