import { AbstractControl } from '@angular/forms';

type MessageFn = (errValue: any) => string;

const MESSAGES: Record<string, string | MessageFn> = {
  required:          'This field is required.',
  email:             'Enter a valid email address.',
  minlength:         (e) => `Minimum ${e.requiredLength} characters required.`,
  maxlength:         (e) => `Maximum ${e.requiredLength} characters allowed.`,
  min:               (e) => `Minimum value is ${e.min}.`,
  max:               (e) => `Maximum value is ${e.max}.`,
  pattern:           'Invalid format.',
  whitespace:        'This field cannot be blank.',
  positiveNumber:    'Must be a positive number.',
  // App-specific
  phone:             'Enter a valid 10-digit mobile number.',
  aadhaar:           'Enter a valid 12-digit Aadhaar number.',
  otp:               'Enter a valid OTP (4–6 digits).',
  pincode:           'Enter a valid 6-digit pincode.',
  url:               'Enter a valid URL (e.g. www.example.com).',
  // Password rules
  passwordUppercase: 'Must include at least one uppercase letter.',
  passwordLowercase: 'Must include at least one lowercase letter.',
  passwordDigit:     'Must include at least one number.',
  passwordMismatch:  'Passwords do not match.',
};

/**
 * Returns the first error message for a control, or '' if valid / untouched.
 * Checks touched state so messages only appear after the user interacts.
 */
export function getFieldError(control: AbstractControl | null | undefined): string {
  if (!control?.touched || !control.errors) return '';
  const key = Object.keys(control.errors)[0];
  const msg = MESSAGES[key];
  if (!msg) return 'Invalid value.';
  return typeof msg === 'function' ? msg(control.errors[key]) : msg;
}

/**
 * Returns true when the control has errors AND has been touched.
 * Useful for applying CSS error classes: [class.input-error]="isInvalid(ctrl)"
 */
export function isInvalid(control: AbstractControl | null | undefined): boolean {
  return !!control?.touched && !!control.errors;
}
