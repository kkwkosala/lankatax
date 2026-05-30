import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lt-disclaimer-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
      <mat-icon class="text-amber-500 shrink-0 text-base mt-0.5">info</mat-icon>
      <span>{{ message }}</span>
    </div>
  `,
})
export class DisclaimerBannerComponent {
  @Input() message = 'This calculation is for estimation purposes only. Consult the Inland Revenue Department of Sri Lanka for official APIT guidance.';
}
