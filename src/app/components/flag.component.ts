import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Small rounded country flag (bundled SVG, offline). iso = "fr", "de"... */
@Component({
  selector: 'cs-flag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="wrap"
      role="img"
      [attr.aria-label]="iso().toUpperCase() + ' flag'"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background-image]="flagUrl()">
    </span>
  `,
  styles: [
    `
      .wrap { display: inline-flex; border-radius: 6px; overflow: hidden;
              box-shadow: 0 0 0 1px var(--cs-border), 0 2px 6px rgba(43, 37, 33, .12);
              flex-shrink: 0; vertical-align: middle; background-position: center;
              background-repeat: no-repeat; background-size: cover; }
    `
  ]
})
export class FlagComponent {
  iso = input.required<string>();
  size = input<number>(22);

  flagUrl(): string {
    const code = this.iso().toLowerCase().replace(/[^a-z-]/g, '');
    return `url("assets/flags/${code || 'xx'}.svg")`;
  }
}
