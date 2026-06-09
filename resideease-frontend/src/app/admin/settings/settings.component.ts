import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);

  activeTab: 'hostel' | 'rooms' | 'mess' | 'policies' | 'system' = 'hostel';
  hasChanges = false;
  saveStatus: 'idle' | 'saving' | 'success' | 'error' = 'idle';

  passwordForm = { current: '', newPass: '', confirm: '' };
  passwordError = '';
  passwordSuccess = false;

  ngOnInit() {
    this.settingsService.loadSettings();
  }

  get settings() {
    return this.settingsService.getSettings()();
  }

  markAsChanged() {
    this.hasChanges = true;
    if (this.saveStatus === 'success') this.saveStatus = 'idle';
  }

  async saveSettings() {
    this.saveStatus = 'saving';
    try {
      await this.settingsService.saveSettings();
      this.hasChanges = false;
      this.saveStatus = 'success';
      setTimeout(() => { this.saveStatus = 'idle'; }, 3500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.saveStatus = 'error';
    }
  }

  discardChanges() {
    this.settingsService.loadSettings();
    this.hasChanges = false;
    this.saveStatus = 'idle';
  }

  addDietaryOption() {
    const current = this.settings.dietaryOptions;
    this.settingsService.updateDietaryOptions([...current, '']);
    this.markAsChanged();
  }

  removeDietaryOption(index: number) {
    const current = this.settings.dietaryOptions;
    const updated = current.filter((_: any, i: number) => i !== index);
    this.settingsService.updateDietaryOptions(updated);
    this.markAsChanged();
  }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = false;
    if (!this.passwordForm.current) {
      this.passwordError = 'Please enter your current password.';
      return;
    }
    if (this.passwordForm.newPass.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }
    if (this.passwordForm.newPass !== this.passwordForm.confirm) {
      this.passwordError = 'Passwords do not match.';
      return;
    }
    this.passwordSuccess = true;
    this.passwordForm = { current: '', newPass: '', confirm: '' };
    setTimeout(() => { this.passwordSuccess = false; }, 3500);
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
