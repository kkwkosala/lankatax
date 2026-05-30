import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lt-error-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div *ngIf="message" class="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
      <mat-icon class="text-red-500 shrink-0 text-base mt-0.5">error</mat-icon>
      <span>{{ message }}</span>
    </div>
  `,
})
export class ErrorAlertComponent {
  @Input() message: string | null = null;
}
