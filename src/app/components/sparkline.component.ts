import { ChangeDetectionStrategy, Component, ElementRef, OnChanges, input, viewChild } from '@angular/core';

/** Lightweight dependency-free SVG line chart for signal/speed/ping series. */
@Component({
  selector: 'cs-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg #svg width="100%" height="100%" preserveAspectRatio="none"></svg>`,
  styles: [`:host { display: block; width: 100%; height: 100%; min-height: 40px; }`]
})
export class SparklineComponent implements OnChanges {
  data = input<(number | null)[]>([]);
  color = input<string>('#3880ff');
  fill = input<boolean>(false);
  height = input<number>(48);

  private svg = viewChild.required<ElementRef<SVGElement>>('svg');

  ngOnChanges(): void {
    this.render();
  }

  render(): void {
    const el = this.svg().nativeElement;
    const w = el.clientWidth || 300;
    const h = this.height();
    el.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const pts = this.data().filter((v): v is number => v != null && isFinite(v));
    el.innerHTML = '';
    if (pts.length < 2) return;
    const src = this.data();
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const stepX = w / Math.max(1, src.length - 1);
    let d = '';
    let started = false;
    src.forEach((v, i) => {
      if (v == null || !isFinite(v)) {
        started = false;
        return;
      }
      const x = i * stepX;
      const y = h - 3 - ((v - min) / span) * (h - 6);
      d += `${started ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
      started = true;
    });
    const c = this.color();
    if (this.fill()) {
      const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      area.setAttribute('d', `${d}L${w},${h} L0,${h} Z`);
      area.setAttribute('fill', c);
      area.setAttribute('opacity', '0.15');
      el.appendChild(area);
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d.trim());
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', c);
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linejoin', 'round');
    el.appendChild(path);
  }
}
