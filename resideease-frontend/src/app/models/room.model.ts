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
  hostelId?: string;
  beds?: { id: string; bedNumber: string; status: string; studentId: string | null }[];
  createdAt: string;
}

export const AMENITY_POOL = [
  'Private Bathroom', 'Shared Bathroom', 'Study Desk', 'Wardrobe',
  'Locker', 'AC', 'Fan', 'WiFi', 'Hot Water', 'Balcony',
  'TV', 'Laundry Access', 'Refrigerator', 'Parking',
] as const;

export const ROOM_AMENITIES: Record<RoomType, string[]> = {
  single: ['Private Bathroom', 'Study Desk', 'Wardrobe', 'AC'],
  double: ['Shared Bathroom', 'Study Desk', 'Wardrobe', 'AC'],
  triple: ['Shared Bathroom', 'Study Desk', 'Locker', 'Fan'],
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
