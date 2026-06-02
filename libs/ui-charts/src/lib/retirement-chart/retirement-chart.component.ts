import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  LineController,
} from 'chart.js';
import { RetirementProjection } from '@lankatax/data-access-budget';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

function abbreviateLkr(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)         return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

@Component({
  selector: 'lt-retirement-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full" style="height: 300px;">
      <canvas #chartCanvas></canvas>
    </div>
  `,
})
export class RetirementChartComponent implements OnChanges {
  @Input({ required: true }) projection!: RetirementProjection;

  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => {
      this.initChart();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projection'] && this.chart) {
      this.updateChart();
    }
  }

  private initChart(): void {
    try {
      const ctx = this.canvasRef.nativeElement.getContext('2d');
      if (!ctx || !this.projection) return;

      this.chart = new Chart(ctx, {
        type: 'line',
        data: this.buildData(),
        options: this.buildOptions(),
      });
    } catch {
      // Silent fallback — text summary still visible below
    }
  }

  private updateChart(): void {
    if (!this.chart) return;
    const data = this.buildData();
    this.chart.data.labels   = data.labels;
    this.chart.data.datasets = data.datasets;
    this.chart.update('active');
  }

  private buildData() {
    return {
      labels: this.projection.labels,
      datasets: [
        {
          label:           'Optimistic (12%)',
          data:            this.projection.optimistic,
          borderColor:     '#16a34a',
          backgroundColor: 'rgba(22,163,74,0.08)',
          fill:            false,
          tension:         0.3,
          pointRadius:     0,
          borderWidth:     2,
        },
        {
          label:           'Base (10%)',
          data:            this.projection.base,
          borderColor:     '#c2410c',
          backgroundColor: 'rgba(194,65,12,0.08)',
          fill:            false,
          tension:         0.3,
          pointRadius:     0,
          borderWidth:     2.5,
        },
        {
          label:           'Pessimistic (8%)',
          data:            this.projection.pessimistic,
          borderColor:     '#9ca3af',
          backgroundColor: 'rgba(156,163,175,0.08)',
          fill:            false,
          tension:         0.3,
          pointRadius:     0,
          borderWidth:     2,
          borderDash:      [4, 4],
        },
      ],
    };
  }

  private buildOptions() {
    return {
      responsive:          true,
      maintainAspectRatio: false,
      interaction:         { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels:   { boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: LKR ${abbreviateLkr(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid:  { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 8 },
        },
        y: {
          grid:  { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font:     { size: 10 },
            callback: (value: string | number) => `LKR ${abbreviateLkr(Number(value))}`,
          },
        },
      },
    };
  }
}
