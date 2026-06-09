import { Injectable, signal } from '@angular/core';
import { OnboardingData } from '../models/onboarding.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private _data = signal<OnboardingData>({
    userDetails: {},
    roomPreferences: {},
    messPreferences: {}
  });

  readonly data = this._data.asReadonly();

  updateUserDetails(details: Partial<OnboardingData['userDetails']>): void {
    this._data.update(d => ({ ...d, userDetails: { ...d.userDetails, ...details } }));
  }

  updateRoomPreferences(prefs: Partial<OnboardingData['roomPreferences']>): void {
    this._data.update(d => ({ ...d, roomPreferences: { ...d.roomPreferences, ...prefs } }));
  }

  updateMessPreferences(prefs: Partial<OnboardingData['messPreferences']>): void {
    this._data.update(d => ({ ...d, messPreferences: { ...d.messPreferences, ...prefs } }));
  }

  reset(): void {
    this._data.set({ userDetails: {}, roomPreferences: {}, messPreferences: {} });
  }

  getRoomPrice(): number {
    const map: Record<string, number> = { single: 8500, double: 5500, triple: 3800 };
    return map[this._data().roomPreferences.roomType ?? ''] ?? 0;
  }

  getMealPrice(): number {
    const map: Record<string, number> = {
      'full-board': 3200, 'half-board': 2100,
      'breakfast-only': 900, 'no-mess': 0
    };
    return map[this._data().messPreferences.mealPlan ?? ''] ?? 0;
  }

  getTotalMonthly(): number {
    return this.getRoomPrice() + this.getMealPrice();
  }
}
