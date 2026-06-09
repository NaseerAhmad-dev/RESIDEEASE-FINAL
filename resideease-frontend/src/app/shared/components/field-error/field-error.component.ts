import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription, merge } from 'rxjs';
import { getFieldError } from '../../validators/error-messages';

/**
 * Displays the first validation error for a reactive form control.
 *
 * Usage:
 *   <app-field-error [control]="form.get('email')" />
 *
 * The component subscribes to the control's status and value changes,
 * so the message updates live without extra code in the parent component.
 */
@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (message) {
      <span class="field-error" role="alert" aria-live="polite">{{ message }}</span>
    }
  `,
  styles: [`
    .field-error {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--c-danger, #dc2626);
      margin-top: 4px;
      line-height: 1.4;
    }
  `],
})
export class FieldErrorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() control: AbstractControl | null | undefined = null;

  message = '';
  private sub?: Subscription;

  ngOnInit(): void {
    this.attach();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['control']) {
      this.sub?.unsubscribe();
      this.attach();
      this.refresh();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private attach(): void {
    if (!this.control) return;
    this.sub = merge(
      this.control.statusChanges,
      this.control.valueChanges,
    ).subscribe(() => this.refresh());
  }

  private refresh(): void {
    this.message = getFieldError(this.control);
  }
}
