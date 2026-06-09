import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';

export interface DropdownOption {
  label: string;
  value: any;
  [key: string]: any;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownComponent),
      multi: true
    }
  ]
})
export class DropdownComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() options: DropdownOption[] = [];
  @Input() errorMessage = '';
  @Input() showFilter = false;
  @Input() filterPlaceholder = 'Search...';
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';

  value: any = null;
  isDisabled = false;
  isTouched = false;

  private _onChange: (value: any) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value ?? null;
  }

  registerOnChange(fn: (value: any) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectionChange(value: any): void {
    this.value = value;
    this._onChange(value);
  }

  onDropdownBlur(): void {
    if (!this.isTouched) {
      this.isTouched = true;
      this._onTouched();
    }
  }

  get hasError(): boolean {
    return this.isTouched && !!this.errorMessage;
  }
}
