import {
  Component, Input, forwardRef, HostListener, ElementRef
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  label: string;
  value: any;
  [key: string]: any;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownComponent),
    multi: true
  }]
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
  isOpen = false;
  filterText = '';

  private _onChange: (value: any) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor(private el: ElementRef) {}

  get displayLabel(): string {
    return this.options.find(o => o[this.optionValue] === this.value)?.[this.optionLabel] ?? '';
  }

  get filteredOptions(): DropdownOption[] {
    if (!this.filterText.trim()) return this.options;
    const q = this.filterText.toLowerCase();
    return this.options.filter(o =>
      String(o[this.optionLabel]).toLowerCase().includes(q)
    );
  }

  get hasError(): boolean {
    return this.isTouched && !!this.errorMessage;
  }

  toggle(): void {
    if (this.isDisabled) return;
    this.isOpen ? this.close() : (this.isOpen = true);
  }

  close(): void {
    this.isOpen = false;
    this.filterText = '';
  }

  select(opt: DropdownOption): void {
    this.value = opt[this.optionValue];
    this._onChange(this.value);
    if (!this.isTouched) { this.isTouched = true; this._onTouched(); }
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    if (this.isOpen && !this.el.nativeElement.contains(e.target)) {
      this.close();
      if (!this.isTouched) { this.isTouched = true; this._onTouched(); }
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen) this.close(); }

  writeValue(value: any): void { this.value = value ?? null; }
  registerOnChange(fn: (value: any) => void): void { this._onChange = fn; }
  registerOnTouched(fn: () => void): void { this._onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled = isDisabled; }
}
