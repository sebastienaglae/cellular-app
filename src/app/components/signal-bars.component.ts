import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'cs-signal-bars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bars" [title]="title()">
      @for (b of bars; track $index) {
        <div class="bar" [class.on]="level() >= $index + 1" [class.bad]="color() === 'bad'" [style.height.px]="4 + $index * 4"></div>
      }
    </div>
  `,
  styles: [`
    .bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 20px; }
    .bar { width: 4px; border-radius: 1.5px; background: var(--cs-bar-track, rgba(128,128,128,.3)); }
    .bar.on { background: var(--cs-ok, #2dd36f); }
    .bar.on.bad { background: var(--cs-bad, #eb445a); }
  `]
})
export class SignalBarsComponent {
  dbm = input<number | null>(null);
  bars = [0, 1, 2, 3, 4];

  level = computed(() => {
    const v = this.dbm();
    if (v == null || !isFinite(v)) return 0;
    if (v >= -60) return 5;
    if (v >= -75) return 4;
    if (v >= -85) return 3;
    if (v >= -95) return 2;
    if (v >= -105) return 1;
    return 0;
  });

  color = computed(() => {
    const l = this.level();
    return l <= 1 ? 'bad' : l === 2 ? 'warn' : 'ok';
  });

  title = computed(() => `${this.dbm() ?? '?'} dBm · ${this.level()}/5`);
}
