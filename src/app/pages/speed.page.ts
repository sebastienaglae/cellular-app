import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonMenuButton, IonButtons, IonNote, IonTitle, IonToggle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playOutline, stopOutline, cloudDownloadOutline, cloudUploadOutline, timerOutline } from 'ionicons/icons';
import Chart from 'chart.js/auto';
import { SpeedService } from '../services/speed.service';
import { StoreService } from '../services/store.service';
import { NativeService } from '../services/native.service';
import { SpeedResult } from '../models';

@Component({
  selector: 'cs-speed',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
    IonButton, IonIcon, IonNote, IonToggle, IonItem, IonLabel, IonList
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Speed Test</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (native.devMode) { <div class="cs-badge dev" style="margin-bottom:10px;">DEV MODE — simulated results</div> }

        <div class="cs-card center">
          @if (running()) {
            <div class="big">{{ phase() }}</div>
            <div class="gauge">{{ liveMbps().toFixed(1) }}</div>
            <div class="cs-dim">Mbps</div>
          } @else {
            @if (last(); as l) {
              <div class="duo">
                <div><span class="cs-dim">DOWN</span><br /><b class="dlv">{{ l.dlMbps != null ? l.dlMbps.toFixed(1) : '—' }}</b><br /><span class="cs-dim">Mbps</span></div>
                <div><span class="cs-dim">UP</span><br /><b class="ulv">{{ l.ulMbps != null ? l.ulMbps.toFixed(1) : '—' }}</b><br /><span class="cs-dim">Mbps</span></div>
                <div><span class="cs-dim">PING</span><br /><b>{{ l.latencyMs != null ? l.latencyMs.toFixed(0) : '—' }}</b><br /><span class="cs-dim">ms</span></div>
              </div>
            } @else {
              <div class="big">Ready</div>
              <div class="cs-dim">Runs against {{ store.settings.dlUrl.length > 40 ? 'configured endpoint' : store.settings.dlUrl }}</div>
            }
          }
          <ion-button [disabled]="running()" (click)="run(false)" style="margin-top:14px;">
            <ion-icon slot="start" name="play-outline"></ion-icon> START TEST
          </ion-button>
        </div>

        <div class="cs-card">
          <ion-item lines="none">
            <ion-toggle [(ngModel)]="constantOn" (ngModelChange)="toggleConstant($event)">
              Continuous monitoring (every {{ store.settings.constantTestMin }} min)
            </ion-toggle>
          </ion-item>
          <div class="cs-dim pad8">
            Each run is saved on-device with GPS location, technology and operator.
            Quick tests download ~5s; full tests also upload. Needs internet - everything else in this app stays offline.
          </div>
        </div>

        <div class="cs-card">
          <h3><ion-icon name="timer-outline"></ion-icon> Saved results</h3>
          <canvas #chart height="180"></canvas>
          @if (!store.tests$.value.length) {
            <div class="cs-empty">No saved tests yet</div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .center { text-align:center; padding:26px 12px; }
      .big { font-size:20px; font-weight:700; margin-bottom:6px; }
      .gauge { font-size:52px; font-weight:800; font-variant-numeric: tabular-nums; line-height:1; color: var(--cs-accent-fg); }
      .duo { display:flex; justify-content:space-around; margin-bottom:6px; }
      .duo > div { text-align:center; }
      .duo b { font-size:26px; font-weight:800; font-variant-numeric:tabular-nums; }
      .dlv { color: var(--cs-info-fg); } .ulv { color: var(--cs-ok-fg); }
      .pad8 { padding:0 8px 4px; }
    `
  ]
})
export class SpeedPage implements OnInit, OnDestroy {
  running = signal(false);
  phase = signal('');
  liveMbps = signal(0);
  last = signal<SpeedResult | null>(null);
  constantOn = false;

  private chart?: Chart;
  private constantTimer?: number;
  private cv = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');

  constructor(
    public speed: SpeedService,
    public store: StoreService,
    public native: NativeService,
    private toast: ToastController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ playOutline, stopOutline, cloudDownloadOutline, cloudUploadOutline, timerOutline });
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

  async run(quick: boolean): Promise<void> {
    if (this.native.devMode) {
      // simulate a curve so the UI feels real in dev mode
      this.running.set(true);
      this.phase.set('DOWNLOAD');
      let v = 0;
      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 90));
        v = Math.max(v, Math.random() * 250 * (i / 25));
        this.liveMbps.set(v);
      }
      const fake = {
        id: `f${Date.now()}`, t: Date.now(),
        dlMbps: v, ulMbps: v / 4, latencyMs: 18, jitterMs: 2.2,
        serverUrl: 'simulated', geo: null, tech: 'NR-SA', operator: 'FakeNet',
        fake: true
      };
      await this.store.addTest(fake);
      this.last.set(fake);
      this.running.set(false);
      this.buildChart();
      return;
    }

    this.running.set(true);
    try {
      const res = await this.speed.runFull({
        quick,
        onProgress: (phase, mbps) => {
          this.phase.set(phase === 'latency' ? 'LATENCY…' : phase === 'download' ? 'DOWNLOAD' : phase === 'upload' ? 'UPLOAD' : 'SAVING');
          this.liveMbps.set(mbps);
        }
      });
      if (res) {
        this.last.set(res);
        this.toastMsg(`Saved ${res.dlMbps?.toFixed(1)} Mbps ↓${res.geo ? ' · 📍' : ''}`);
        this.buildChart();
      } else {
        this.toastMsg('Test failed - check connectivity & endpoint URL');
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
          y: {
            beginAtZero: true,
            ticks: { font: { size: 9 }, color: txt },
            grid: { color: grid }
          },
          x: {
            ticks: { maxTicksLimit: 8, font: { size: 9 }, color: txt },
            grid: { color: grid }
          }
        }
      }
    });
  }

  private async toastMsg(m: string): Promise<void> {
    const t = await this.toast.create({ message: m, duration: 2200, position: 'bottom' });
    await t.present();
  }
}
