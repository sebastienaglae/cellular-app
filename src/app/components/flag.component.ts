import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Small rounded country flag (bundled SVG, offline). iso = "fr", "de"... */
@Component({
  selector: 'cs-flag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="wrap" [style.width.px]="size()" [style.height.px]="size()">
      <span [class]="'fi fis fi-' + iso().toLowerCase()"></span>
    </span>
  `,
  styles: [
    `
      .wrap { display: inline-flex; border-radius: 6px; overflow: hidden;
              box-shadow: 0 0 0 1px var(--cs-border); flex-shrink: 0;
              vertical-align: middle; }
      .wrap .fi { width: 100%; height: 100%; background-size: cover;
                  display: block; }
    `
  ]
})
export class FlagComponent {
  iso = input.required<string>();
  size = input<number>(22);
}
