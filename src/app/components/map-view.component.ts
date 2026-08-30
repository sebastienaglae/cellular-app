import {
  ChangeDetectionStrategy, Component, ElementRef, NgZone, input, OnChanges, OnInit, OnDestroy, viewChild
} from '@angular/core';

export interface HeatPoint {
  lat: number;
  lon: number;
  color: string;
  radius?: number;
}

export interface MapMarker {
  lat: number;
  lon: number;
  color?: string;
  size?: number;
  label?: string;
}

/**
 * Offline slippy-map on canvas rendering bundled OpenStreetMap tiles (z0-4,
 * whole world, low detail by design). Pan + pinch/wheel zoom, markers overlay.
 * Tiles (c) OpenStreetMap contributors - attribution drawn on canvas.
 */
@Component({
  selector: 'cs-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #cv></canvas>`,
  styles: [
    `
      :host { display:block; position:relative; width:100%; height:100%; min-height:220px; touch-action:none; overflow:hidden; border:1px solid var(--cs-border); }
      :host::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.16;
        background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);
        background-size:32px 32px; mix-blend-mode:overlay; }
      canvas { width:100%; height:100%; display:block; cursor:crosshair; }
    `
  ]
})
export class MapViewComponent implements OnChanges, OnInit, OnDestroy {
  markers = input<MapMarker[]>([]);
  heat = input<HeatPoint[]>([]);
  fitToMarkers = input<boolean>(true);

  private cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private ctx: CanvasRenderingContext2D | null = null;
  private tiles = new Map<string, HTMLImageElement>();
  private zf = 2.4;              // fractional zoom
  private cx = 0;                // center in world px @ zf
  private cy = 0;
  private ro?: ResizeObserver;
  private raf = 0;

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.setup();
    // start over western/central Europe-ish until markers arrive
    this.cx = this.lonToWorld(8, this.zf);
    this.cy = this.latToWorld(49, this.zf);
    this.requestDraw();
  }

  ngOnChanges(): void {
    if (this.fitToMarkers() && this.markers().length) this.fit();
    this.requestDraw();
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  // ------------------------------------------------------------ projection

  private worldSize(z: number): number {
    return 256 * Math.pow(2, z);
  }
  private lonToWorld(lon: number, z: number): number {
    return ((lon + 180) / 360) * this.worldSize(z);
  }
  private latToWorld(lat: number, z: number): number {
    const s = Math.sin((lat * Math.PI) / 180);
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * this.worldSize(z);
  }

  // ---------------------------------------------------------------- setup

  private setup(): void {
    const c = this.cv().nativeElement;
    this.ctx = c.getContext('2d');
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = Math.max(50, Math.round(r.width * devicePixelRatio));
      c.height = Math.max(50, Math.round(r.height * devicePixelRatio));
      this.ctx?.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      this.requestDraw();
    };
    resize();
    this.ro = new ResizeObserver(() => resize());
    this.ro.observe(c);

    let dragging = false;
    let lx = 0;
    let ly = 0;
    c.addEventListener('pointerdown', e => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener('pointermove', e => {
      if (!dragging) return;
      this.cx -= e.clientX - lx;
      this.cy -= e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      this.clampCenter();
      this.requestDraw();
    });
    c.addEventListener('pointerup', () => (dragging = false));
    c.addEventListener('pointercancel', () => (dragging = false));
    c.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      this.zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.25 : 1 / 1.25);
    }, { passive: false });

    const pts = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    c.addEventListener('pointerdown', e => pts.set(e.pointerId, { x: e.clientX, y: e.clientY }));
    c.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0 && d !== pinch) {
          const rect = c.getBoundingClientRect();
          this.zoomAt(
            (a.x + b.x) / 2 - rect.left,
            (a.y + b.y) / 2 - rect.top,
            d / pinch
          );
        }
        pinch = d;
      }
    });
    const clear = () => {
      pts.clear();
      pinch = 0;
    };
    c.addEventListener('pointerup', clear);
    c.addEventListener('pointercancel', clear);
  }

  private zoomAt(mx: number, my: number, k: number): void {
    const c = this.cv().nativeElement;
    const nzf = Math.min(4.9, Math.max(0, this.zf + Math.log2(k)));
    const f = Math.pow(2, nzf - this.zf);
    const wx = mx - c.clientWidth / 2 + this.cx;
    const wy = my - c.clientHeight / 2 + this.cy;
    this.cx = wx * f - (mx - c.clientWidth / 2);
    this.cy = wy * f - (my - c.clientHeight / 2);
    this.zf = nzf;
    this.clampCenter();
    this.requestDraw();
  }

  private clampCenter(): void {
    const w = this.worldSize(this.zf);
    const el = this.cv()?.nativeElement;
    const vw = el?.clientWidth || 300;
    const vh = el?.clientHeight || 200;
    this.cx = Math.max(0, Math.min(w, this.cx));
    this.cy = Math.max(vh / 2 > w / 2 ? w / 2 : 0, Math.min(w, Math.max(vh / 2, this.cy)));
  }

  private fit(): void {
    const ms = this.markers().filter(m => isFinite(m.lat) && isFinite(m.lon));
    const el = this.cv()?.nativeElement;
    if (!ms.length || !el) return;
    const w = el.clientWidth || 300;
    const h = el.clientHeight || 200;
    if (ms.length === 1) {
      this.zf = 4;
      this.cx = this.lonToWorld(ms[0].lon, this.zf);
      this.cy = this.latToWorld(ms[0].lat, this.zf);
      return;
    }
    const lats = ms.map(m => m.lat);
    const lons = ms.map(m => m.lon);
    const latMin = Math.min(...lats), latMax = Math.max(...lats);
    const lonMin = Math.min(...lons), lonMax = Math.max(...lons);
    let best = 0;
    for (let z = 4; z >= 0; z -= 0.25) {
      const dx = Math.abs(this.lonToWorld(lonMax, z) - this.lonToWorld(lonMin, z)) + 80;
      const dy = Math.abs(this.latToWorld(latMin, z) - this.latToWorld(latMax, z)) + 80;
      if (dx < w && dy < h) {
        best = z;
        break;
      }
    }
    this.zf = best;
    this.cx = (this.lonToWorld(lonMin, best) + this.lonToWorld(lonMax, best)) / 2;
    this.cy = (this.latToWorld(latMin, best) + this.latToWorld(latMax, best)) / 2;
  }

  // ----------------------------------------------------------------- draw

  private requestDraw(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  }

  private tileImg(tz: number, tx: number, ty: number): HTMLImageElement | null {
    const key = `${tz}/${tx}/${ty}`;
    let img = this.tiles.get(key);
    if (!img) {
      img = new Image();
      img.onload = () => this.requestDraw();
      img.onerror = () => {
        // mark as permanently broken so we stop re-requesting/redrawing
        img!.setAttribute('data-broken', '1');
      };
      img.src = `assets/tiles/${tz}/${tx}/${ty}.png`;
      this.tiles.set(key, img);
    }
    if (img.hasAttribute('data-broken')) return null;
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const c = this.cv().nativeElement;
    const w = c.clientWidth || 300;
    const h = c.clientHeight || 200;

    const styles = getComputedStyle(document.documentElement);
    const surface = (styles.getPropertyValue('--cs-map-bg') || '#ddd').trim();
    const fg = (styles.getPropertyValue('--ion-text-color') || '#333').trim();
    const tileFilter = (styles.getPropertyValue('--cs-map-filter') || 'none').trim();

    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, w, h);

    const tz = Math.max(0, Math.min(4, Math.floor(this.zf)));
    const scale = Math.pow(2, this.zf - tz);       // zf px per tz px
    const tileScreen = 256 * scale;
    const world = this.worldSize(tz);

    const left = this.cx - w / 2;
    const top = this.cy - h / 2;
    const tx0 = Math.floor(left / tileScreen);
    const ty0 = Math.floor(top / tileScreen);
    const tx1 = Math.floor((left + w) / tileScreen);
    const ty1 = Math.floor((top + h) / tileScreen);
    const n = 2 ** tz;

    ctx.filter = tileFilter;
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let ty = ty0; ty <= ty1; ty++) {
        if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue;
        const sx = tx * tileScreen - left;
        const sy = ty * tileScreen - top;
        const img = this.tileImg(tz, tx, ty);
        if (img) {
          ctx.drawImage(img, Math.floor(sx), Math.floor(sy), Math.ceil(tileScreen) + 1, Math.ceil(tileScreen) + 1);
        }
      }
    }
    ctx.filter = 'none';

    // heat blobs (drawn under markers, alpha-stacked)
    const heat = this.heat();
    if (heat.length) {
      for (const hp of heat) {
        if (!isFinite(hp.lat) || !isFinite(hp.lon)) continue;
        const mx = this.lonToWorld(hp.lon, this.zf) - left;
        const my = this.latToWorld(hp.lat, this.zf) - top;
        if (mx < -40 || my < -40 || mx > w + 40 || my > h + 40) continue;
        const r = hp.radius ?? 22;
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, r);
        grad.addColorStop(0, hp.color);
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // markers
    for (const m of this.markers()) {
      if (!isFinite(m.lat) || !isFinite(m.lon)) continue;
      const mx = this.lonToWorld(m.lon, this.zf) - left;
      const my = this.latToWorld(m.lat, this.zf) - top;
      if (mx < -20 || my < -20 || mx > w + 20 || my > h + 20) continue;
      const r = m.size ?? 6;
      ctx.beginPath();
      ctx.arc(mx, my, r + 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, Math.PI * 2);
      ctx.fillStyle = m.color || '#d97757';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (m.label) {
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = fg;
        ctx.strokeStyle = surface;
        ctx.lineWidth = 3;
        ctx.strokeText(m.label, mx + r + 4, my + 4);
        ctx.fillText(m.label, mx + r + 4, my + 4);
      }
    }

    // attribution
    ctx.font = '10px system-ui, sans-serif';
    const attr = '© OpenStreetMap contributors';
    const tw = ctx.measureText(attr).width;
    ctx.fillStyle = 'rgba(128,128,128,.35)';
    ctx.fillRect(w - tw - 12, h - 18, tw + 10, 15);
    ctx.fillStyle = '#fff';
    ctx.fillText(attr, w - tw - 7, h - 7);
  }
}
