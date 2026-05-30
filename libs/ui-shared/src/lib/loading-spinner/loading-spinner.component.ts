import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'lt-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="flex items-center justify-center py-12">
      <mat-spinner diameter="48"></mat-spinner>
    </div>
  `,
})
export class LoadingSpinnerComponent {}
