import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { levelForDbm } from '../utils/view';

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

  level = computed(() => levelForDbm(this.dbm()));

  color = computed(() => {
    const l = this.level();
    return l <= 1 ? 'bad' : l === 2 ? 'warn' : 'ok';
  });

  title = computed(() => `${this.dbm() ?? '?'} dBm · ${this.level()}/5`);
}
