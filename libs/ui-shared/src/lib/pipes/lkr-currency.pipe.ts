import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'lkrCurrency', standalone: true, pure: true })
export class LkrCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined) return '—';
    const formatted = new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return showSymbol ? `LKR ${formatted}` : formatted;
  }
}
