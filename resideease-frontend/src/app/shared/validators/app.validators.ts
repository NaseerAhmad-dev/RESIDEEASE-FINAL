import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class AppValidators {

  /** Indian mobile: optional +91/91/0 prefix, then 6–9 starting 10-digit number */
  static phone(control: AbstractControl): ValidationErrors | null {
    const v = control.value?.toString().trim().replace(/[\s\-()]/g, '');
    if (!v) return null;
    return /^(\+91|91|0)?[6-9]\d{9}$/.test(v) ? null : { phone: true };
  }

  /** Aadhaar: exactly 12 digits */
  static aadhaar(control: AbstractControl): ValidationErrors | null {
    const v = control.value?.toString().replace(/\s/g, '');
    if (!v) return null;
    return /^\d{12}$/.test(v) ? null : { aadhaar: true };
  }

  /** OTP: 4–6 digits */
  static otp(control: AbstractControl): ValidationErrors | null {
    const v = control.value?.toString().trim();
    if (!v) return null;
    return /^\d{4,6}$/.test(v) ? null : { otp: true };
  }

  /** Indian pincode: exactly 6 digits */
  static pincode(control: AbstractControl): ValidationErrors | null {
    const v = control.value?.toString().trim();
    if (!v) return null;
    return /^\d{6}$/.test(v) ? null : { pincode: true };
  }

  /** URL — with or without protocol */
  static url(control: AbstractControl): ValidationErrors | null {
    const v = control.value?.toString().trim();
    if (!v) return null;
    try {
      new URL(v.startsWith('http') ? v : `https://${v}`);
      return null;
    } catch {
      return { url: true };
    }
  }

  /** Rejects values that are all whitespace */
  static noWhitespace(control: AbstractControl): ValidationErrors | null {
    const v = control.value?.toString();
    if (!v) return null;
    return v.trim().length ? null : { whitespace: true };
  }

  /** Must be a number strictly greater than zero */
  static positiveNumber(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '') return null;
    return Number(control.value) > 0 ? null : { positiveNumber: true };
  }

  /**
   * Password strength: min 8 chars, at least one uppercase, lowercase, and digit.
   * Returns individual error keys so the template can highlight each rule separately.
   */
  static strongPassword(control: AbstractControl): ValidationErrors | null {
    const v: string = control.value ?? '';
    if (!v) return null;
    const errors: ValidationErrors = {};
    if (v.length < 8)       errors['minlength']        = { requiredLength: 8, actualLength: v.length };
    if (!/[A-Z]/.test(v))   errors['passwordUppercase'] = true;
    if (!/[a-z]/.test(v))   errors['passwordLowercase'] = true;
    if (!/\d/.test(v))       errors['passwordDigit']     = true;
    return Object.keys(errors).length ? errors : null;
  }

  /**
   * Cross-field validator: confirms two password fields match.
   * Apply to the FormGroup, not individual controls.
   *
   * Usage:
   *   fb.group({ password: [...], confirmPassword: [...] },
   *            { validators: AppValidators.passwordMatch('password', 'confirmPassword') })
   */
  static passwordMatch(pwField: string, confirmField: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const pw  = group.get(pwField)?.value;
      const cfm = group.get(confirmField);
      if (!pw || !cfm?.value) return null;

      if (pw !== cfm.value) {
        cfm.setErrors({ ...(cfm.errors ?? {}), passwordMismatch: true });
        return { passwordMismatch: true };
      }

      // Clear only the passwordMismatch key, preserve any other errors
      if (cfm.errors?.['passwordMismatch']) {
        const { passwordMismatch: _, ...rest } = cfm.errors;
        cfm.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    };
  }
}
