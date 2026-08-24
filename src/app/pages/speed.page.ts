import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel,
  IonMenuButton, IonButtons, IonNote, IonTitle, IonToggle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playOutline, stopOutline, timerOutline } from 'ionicons/icons';
import Chart from 'chart.js/auto';
import { SpeedService } from '../services/speed.service';
import { StoreService } from '../services/store.service';
import { NativeService } from '../services/native.service';
import { SpeedResult } from '../models';
import { FlagComponent } from '../components/flag.component';

@Component({
  selector: 'cs-speed',
  standalone: true,
  imports: [
    FormsModule, FlagComponent,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
    IonButton, IonIcon, IonNote, IonToggle, IonItem, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Speed Test</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (native.devMode) { <div class="cs-badge dev" style="margin-bottom:12px;">DEV MODE — SIMULATED RESULTS</div> }

        <div class="cs-card gauge-card">
          <div class="gauge-wrap">
            <svg viewBox="0 0 200 200">
              <circle class="track" cx="100" cy="100" r="86" />
              <circle class="prog" cx="100" cy="100" r="86"
                      [style.stroke]="phase() === 'UPLOAD' ? 'var(--cs-ok)' : 'var(--cs-accent)'"
                      [style.stroke-dashoffset]="dash()" />
            </svg>
            <div class="gauge-center">
              @if (running()) {
                <div class="phase">{{ phase() }}</div>
                <div class="live">{{ fmtNum(liveMbps()) }}</div>
                <div class="unit">Mbps</div>
              } @else {
                @if (last(); as l) {
                  <div class="phase">LAST RESULT</div>
                  <div class="live">{{ l.dlMbps != null ? fmtNum(l.dlMbps) : '—' }}</div>
                  <div class="unit">Mbps down</div>
                } @else {
                  <div class="phase">READY</div>
                  <div class="live">—</div>
                  <div class="unit">tap start</div>
                }
              }
            </div>
          </div>

          @if (!running()) {
            <ion-button expand="block" [disabled]="busy()" (click)="run(false)" class="start-btn">
              <ion-icon slot="start" name="play-outline"></ion-icon>
              {{ last() ? 'RUN AGAIN' : 'START TEST' }}
            </ion-button>
          } @else {
            <ion-button expand="block" fill="outline" (click)="speed.cancel()" class="start-btn">
              <ion-icon slot="start" name="stop-outline"></ion-icon> STOP
            </ion-button>
          }
        </div>

        @if (last(); as l) {
          <div class="res-grid">
            <div class="res"><span class="cs-dim">DOWN</span><b class="v-dl">{{ l.dlMbps != null ? fmtNum(l.dlMbps) : '—' }}</b><span class="cs-dim">Mbps</span></div>
            <div class="res"><span class="cs-dim">UP</span><b class="v-ul">{{ l.ulMbps != null ? fmtNum(l.ulMbps) : '—' }}</b><span class="cs-dim">Mbps</span></div>
            <div class="res"><span class="cs-dim">LATENCY</span><b>{{ l.latencyMs != null ? fmtNum(l.latencyMs) : '—' }}</b><span class="cs-dim">ms</span></div>
          </div>
          @if (l.geo) {
            <div class="cs-card loc-card">
              <div class="loc-row">
                <span class="cs-dim">Measured at</span>
                <span class="cs-mono">{{ l.geo.lat.toFixed(4) }}, {{ l.geo.lon.toFixed(4) }}</span>
              </div>
              @if (movedText(l); as mv) { <div class="loc-row"><span class="cs-dim">Movement</span><span>{{ mv }}</span></div> }
              <div class="loc-row">
                <span class="cs-dim">Network</span>
                <span>
                  {{ l.tech || '?' }} @if (l.operator) {· {{ l.operator }}}
                </span>
              </div>
            </div>
          }
        }

        <div class="cs-card">
          <ion-item lines="none">
            <ion-toggle [(ngModel)]="constantOn" (ngModelChange)="toggleConstant($event)">
              Continuous monitoring
              <p style="font-size:11.5px">every {{ store.settings.constantTestMin }} min, geo-tagged, saved on device</p>
            </ion-toggle>
          </ion-item>
        </div>

        <div class="cs-card">
          <h3>History</h3>
          <canvas #chart height="190"></canvas>
          @if (!store.tests$.value.length) {
            <div class="cs-empty">No saved tests yet</div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .gauge-card { text-align: center; padding: 22px 16px 18px; }
      .gauge-wrap { position: relative; width: 210px; height: 210px; margin: 0 auto 14px; }
      svg { width: 100%; height: 100%; transform: rotate(-90deg); }
      circle { fill: none; stroke-width: 10; stroke-linecap: round; }
      .track { stroke: var(--cs-bar-track); }
      .prog { stroke-dasharray: 540; stroke-dashoffset: 540; transition: stroke-dashoffset .25s ease, stroke .3s; }
      .gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column;
                      align-items: center; justify-content: center; gap: 2px; }
      .phase { font-size: 11px; letter-spacing: .14em; color: var(--ion-color-medium); font-weight: 600; }
      .live { font-size: 44px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.05;
              font-family: var(--font-serif); }
      .unit { font-size: 12px; color: var(--ion-color-medium); }
      .start-btn { max-width: 280px; margin: 0 auto; }
      .res-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
      .res { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 14px;
             padding: 12px 6px; text-align: center; display: flex; flex-direction: column; gap: 3px; }
      .res b { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .v-dl { color: var(--cs-accent-fg); } .v-ul { color: var(--cs-ok-fg); }
      .loc-card { padding: 12px 14px; }
      .loc-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px;
                 padding: 4px 0; }
    `
  ]
})
export class SpeedPage implements OnInit, OnDestroy {
  running = signal(false);
  phase = signal('');
  liveMbps = signal(0);
  peak = signal(100);
  last = signal<SpeedResult | null>(null);
  constantOn = false;

  private chart?: Chart;
  private constantTimer?: number;
  private cv = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');

  constructor(
    public speed: SpeedService,
    public store: StoreService,
    public native: NativeService,
    private toast: ToastController
  ) {
    addIcons({ playOutline, stopOutline, timerOutline });
  }

  async ngOnInit(): Promise<void> {
    const t = this.store.tests$.value;
    this.last.set(t[t.length - 1] || null);
    setTimeout(() => this.buildChart(), 60);
    if (this.store.settings.constantTestEnabled) {
      this.constantOn = true;
      this.startConstantTimer();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.stopConstantTimer();
  }

  dash(): number {
    const C = 540;
    const max = Math.max(50, this.peak());
    const pct = Math.min(1, this.liveMbps() / max);
    return C * (1 - pct);
  }

  fmtNum(v: number): string {
    return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  }

  movedText(l: SpeedResult): string | null {
    const tests = this.store.tests$.value;
    const idx = tests.findIndex(x => x.id === l.id);
    if (idx <= 0) return null;
    const prev = tests[idx - 1];
    if (!prev.geo || !l.geo) return null;
    const km = haversineKm(prev.geo.lat, prev.geo.lon, l.geo.lat, l.geo.lon);
    if (km < 0.05) return 'same location as previous test';
    return `${km < 1 ? (km * 1000).toFixed(0) + ' m' : km.toFixed(1) + ' km'} from previous test`;
  }

  async run(quick: boolean): Promise<void> {
    if (this.native.devMode) {
      this.running.set(true);
      let v = 0;
      const peak = 120 + Math.random() * 300;
      this.peak.set(Math.ceil(peak / 50) * 50);
      for (const ph of ['DOWNLOAD', 'UPLOAD'] as const) {
        this.phase.set(ph);
        v = 0;
        for (let i = 0; i < 22; i++) {
          await new Promise(r => setTimeout(r, 80));
          v = Math.max(v, peak * (ph === 'UPLOAD' ? 0.35 : 1) * (i / 22) * (0.85 + Math.random() * 0.3));
          this.liveMbps.set(v);
          this.peak.set(Math.max(this.peak(), Math.ceil((v * 1.15) / 50) * 50));
        }
      }
      const fake = {
        id: `f${Date.now()}`, t: Date.now(),
        dlMbps: peak * 0.92, ulMbps: peak * 0.3, latencyMs: 18, jitterMs: 2.2,
        serverUrl: 'simulated',
        geo: { lat: 43.659 + Math.random() * 0.001, lon: 7.134 + Math.random() * 0.001, acc: 20 },
        tech: 'LTE-IWLAN', operator: 'Free', fake: true
      };
      await this.store.addTest(fake);
      this.last.set(fake);
      this.running.set(false);
      this.phase.set('');
      this.liveMbps.set(0);
      this.buildChart();
      return;
    }

    this.running.set(true);
    this.peak.set(100);
    try {
      const res = await this.speed.runFull({
        quick,
        onProgress: (phase, mbps) => {
          this.phase.set(phase.toUpperCase());
          this.liveMbps.set(mbps);
          if (mbps > 0) {
            this.peak.set(Math.max(this.peak(), Math.ceil((mbps * 1.15) / 50) * 50));
          }
        }
      });
      if (res) {
        this.last.set(res);
        this.toastMsg(`Saved ${res.dlMbps?.toFixed(1)} Mbps down`);
        this.buildChart();
      } else {
        this.toastMsg('Test failed — check connectivity and endpoint URL');
      }
    } finally {
      this.running.set(false);
      this.phase.set('');
      this.liveMbps.set(0);
    }
  }

  toggleConstant(on: boolean): void {
    this.store.saveSettings({ constantTestEnabled: on });
    if (on) {
      this.startConstantTimer();
      this.run(false);
      this.toastMsg(`Continuous testing every ${this.store.settings.constantTestMin} min`);
    } else {
      this.stopConstantTimer();
    }
  }

  private startConstantTimer(): void {
    this.stopConstantTimer();
    const ms = Math.max(5, this.store.settings.constantTestMin) * 60000;
    this.constantTimer = window.setInterval(() => {
      if (!document.hidden) this.run(false);
    }, ms);
  }

  private stopConstantTimer(): void {
    if (this.constantTimer) {
      clearInterval(this.constantTimer);
      this.constantTimer = undefined;
    }
  }

  private buildChart(): void {
    const el = this.cv()?.nativeElement;
    if (!el) return;
    const cs = getComputedStyle(document.documentElement);
    const txt = (cs.getPropertyValue('--cs-chart-text') || '#888').trim() || '#888';
    const grid = (cs.getPropertyValue('--cs-chart-grid') || 'rgba(128,128,128,.15)').trim();
    const tests = [...this.store.tests$.value].slice(-50);
    this.chart?.destroy();
    this.chart = new Chart(el, {
      type: 'line',
      data: {
        labels: tests.map(t => new Date(t.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        datasets: [
          {
            label: 'Down Mbps',
            data: tests.map(t => t.dlMbps),
            borderColor: '#c9603f',
            backgroundColor: 'rgba(201,96,63,.14)',
            tension: 0.3,
            pointRadius: 2,
            fill: true
          },
          {
            label: 'Up Mbps',
            data: tests.map(t => t.ulMbps),
            borderColor: '#4d7c4a',
            backgroundColor: 'rgba(77,124,74,.12)',
            tension: 0.3,
            pointRadius: 2,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { labels: { boxWidth: 12, font: { size: 10 }, color: txt } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 9 }, color: txt }, grid: { color: grid } },
          x: { ticks: { maxTicksLimit: 8, font: { size: 9 }, color: txt }, grid: { color: grid } }
        }
      }
    });
  }

  private async toastMsg(m: string): Promise<void> {
    const t = await this.toast.create({ message: m, duration: 2200, position: 'bottom' });
    await t.present();
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
