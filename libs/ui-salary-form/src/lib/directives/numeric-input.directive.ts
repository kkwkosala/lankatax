import { Directive, ElementRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

/**
 * Displays LKR numeric inputs with comma formatting on blur,
 * raw number on focus — while keeping form control values as numbers.
 * Usage: <input ltNumeric formControlName="..." type="text" inputmode="decimal" />
 */
@Directive({
  selector: 'input[ltNumeric]',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: NumericInputDirective, multi: true },
  ],
  host: {
    '(blur)':  'onBlur()',
    '(focus)': 'onFocus()',
    '(input)': 'onInput($event)',
  },
})
export class NumericInputDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  private numericValue: number | null = null;
  private onChange: (v: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    this.numericValue = value;
    this.el.nativeElement.value = value != null ? this.format(value) : '';
  }

  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.el.nativeElement.disabled = disabled; }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/,/g, '');
    const parsed = parseFloat(raw);
    this.numericValue = raw === '' || isNaN(parsed) ? null : parsed;
    this.onChange(this.numericValue);
  }

  onFocus(): void {
    this.el.nativeElement.value = this.numericValue != null ? String(this.numericValue) : '';
  }

  onBlur(): void {
    this.onTouched();
    if (this.numericValue != null) {
      this.el.nativeElement.value = this.format(this.numericValue);
    }
  }

  private format(val: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(val);
  }
}
