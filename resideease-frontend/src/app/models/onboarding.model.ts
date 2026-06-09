export interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  rollNumber: string;
  profilePicture?: string;
}

export interface RoomPreferences {
  roomType: 'single' | 'double' | 'triple';
  floor: 'low' | 'mid' | 'high' | 'no-preference';
  quietZone: boolean;
  wifiPriority: boolean;
  nearCommonRoom: boolean;
  checkInDate: string;
}

export interface MessPreferences {
  mealPlan: 'full-board' | 'half-board' | 'breakfast-only' | 'no-mess';
  dietaryPreferences: string[];
  specialRequirements: string;
}

export interface OnboardingData {
  userDetails: Partial<UserDetails>;
  roomPreferences: Partial<RoomPreferences>;
  messPreferences: Partial<MessPreferences>;
}

export const ROOM_OPTIONS = [
  {
    id: 'single' as const,
    label: 'Single Room',
    description: 'Private room for yourself',
    price: 8500,
    icon: '🛏️',
    amenities: ['Private Bathroom', 'Study Desk', 'Wardrobe']
  },
  {
    id: 'double' as const,
    label: 'Double Sharing',
    description: 'Shared with one roommate',
    price: 5500,
    icon: '🪟',
    amenities: ['Shared Bathroom', 'Study Desk', 'Wardrobe'],
    badge: 'Popular'
  },
  {
    id: 'triple' as const,
    label: 'Triple Sharing',
    description: 'Shared with two roommates',
    price: 3800,
    icon: '🏠',
    amenities: ['Shared Bathroom', 'Study Desk', 'Locker']
  }
];

export const MEAL_PLANS = [
  {
    id: 'full-board' as const,
    label: 'Full Board',
    description: 'Breakfast, Lunch & Dinner every day',
    price: 3200,
    badge: 'Best Value',
    badgeColor: 'indigo',
    timings: 'Morning · Afternoon · Evening'
  },
  {
    id: 'half-board' as const,
    label: 'Half Board',
    description: 'Breakfast & Dinner included',
    price: 2100,
    badge: 'Flexible',
    badgeColor: 'sky',
    timings: 'Morning · Evening'
  },
  {
    id: 'breakfast-only' as const,
    label: 'Breakfast Only',
    description: 'Start your day right',
    price: 900,
    badge: 'Lite',
    badgeColor: 'amber',
    timings: 'Morning only'
  },
  {
    id: 'no-mess' as const,
    label: 'No Mess Plan',
    description: 'Kitchen access included',
    price: 0,
    badge: 'Self-catering',
    badgeColor: 'gray',
    timings: 'Kitchen 6am – 10pm'
  }
];

export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Jain', 'Halal', 'Kosher',
  'Gluten-Free', 'Dairy-Free', 'High Protein', 'Low Carb', 'No Nuts'
];
