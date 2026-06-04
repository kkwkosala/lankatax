import {
  Component,
  Input,
  OnChanges,
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
  type TooltipItem,
} from 'chart.js';
import { FireProjection } from '@lankatax/data-access-budget';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

function abbreviateLkr(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)         return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

@Component({
  selector: 'lt-fire-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="relative w-full" style="height:320px;"><canvas #chartCanvas></canvas></div>`,
})
export class FireChartComponent implements OnChanges {
  @Input({ required: true }) projection!: FireProjection;

  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => this.initChart());
  }

  ngOnChanges(): void {
    if (this.chart) this.updateChart();
  }

  private initChart(): void {
    try {
      const ctx = this.canvasRef.nativeElement.getContext('2d');
      if (!ctx || !this.projection) return;
      this.chart = new Chart(ctx, { type: 'line', data: this.buildData(), options: this.buildOptions() });
    } catch { /* Silent — text summary visible below chart */ }
  }

  private updateChart(): void {
    if (!this.chart) return;
    const data = this.buildData();
    this.chart.data.labels   = data.labels;
    this.chart.data.datasets = data.datasets;
    this.chart.update('active');
  }

  private buildData() {
    const threshold    = this.projection.independenceThreshold;
    const crossoverIdx = this.projection.crossoverIndex;
    const realCorpus   = this.projection.realCorpus ?? [];

    // Crossover dot appears on the real corpus line
    const realPointRadii = realCorpus.map((_, i) => i === crossoverIdx ? 6 : 0);
    const realPointColors = realCorpus.map((_, i) =>
      i === crossoverIdx ? '#16a34a' : 'transparent'
    );

    return {
      labels: this.projection.labels,
      datasets: [
        {
          label:                'Corpus (Nominal)',
          data:                 this.projection.corpus,
          borderColor:          '#c2410c',
          backgroundColor:      'rgba(194,65,12,0.05)',
          fill:                 true,
          tension:              0.3,
          pointRadius:          0,
          borderWidth:          2,
        },
        {
          label:                'Real Corpus (Today\'s LKR)',
          data:                 realCorpus,
          borderColor:          '#d97706',
          backgroundColor:      'transparent',
          fill:                 false,
          tension:              0.3,
          borderDash:           [5, 4],
          pointRadius:          realPointRadii,
          pointBackgroundColor: realPointColors,
          borderWidth:          2.5,
        },
        {
          label:                'Independence Target',
          data:                 Array(this.projection.labels.length).fill(threshold),
          borderColor:          '#16a34a',
          borderDash:           [6, 4],
          backgroundColor:      'transparent',
          fill:                 false,
          tension:              0,
          pointRadius:          0,
          borderWidth:          2,
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
            label: (ctx: TooltipItem<'line'>) =>
              ` ${ctx.dataset.label}: LKR ${abbreviateLkr(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid:  { display: false },
          ticks: { font: { size: 10 }, maxTicksLimit: 10 },
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
