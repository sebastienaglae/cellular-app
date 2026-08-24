import { Component, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput,
  IonItem, IonLabel, IonList, IonMenuButton, IonNote, IonSegment,
  IonSegmentButton, IonTitle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playOutline, stopOutline } from 'ionicons/icons';
import { NativeService } from '../services/native.service';
import { StoreService } from '../services/store.service';
import { PingSession } from '../models';

@Component({
  selector: 'cs-ping',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
    IonItem, IonInput, IonButton, IonIcon, IonNote, IonSegment, IonSegmentButton, IonLabel, IonList
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ping</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))" class="seg">
          <ion-segment-button value="live"><ion-label>Live</ion-label></ion-segment-button>
          <ion-segment-button value="history"><ion-label>History</ion-label></ion-segment-button>
        </ion-segment>

        @if (tab() === 'live') {
          @if (native.devMode) { <div class="cs-badge dev" style="margin:10px 0;">DEV MODE — SIMULATED RESULTS</div> }

          <div class="cs-card center">
            @if (running()) {
              <div class="live-num">{{ lastMs() != null ? lastMs().toFixed(1) : '…' }}</div>
              <div class="unit">ms — {{ host }}</div>
              <div class="sent cs-dim">{{ times().length }} probes sent</div>
              <ion-button size="small" fill="outline" (click)="stop()">
                <ion-icon slot="start" name="stop-outline"></ion-icon> STOP
              </ion-button>
            } @else {
              <div class="live-num dim">—</div>
              <div class="unit">not running</div>
            }
          </div>

          <div class="cs-card">
            <ion-item lines="none">
              <ion-input label="Host / IP" labelPlacement="stacked" [(ngModel)]="host" [disabled]="running()"></ion-input>
            </ion-item>
            <div class="presets">
              @for (p of presets; track p) {
                <button class="chip-btn" [disabled]="running()" (click)="host = p">{{ p }}</button>
              }
            </div>
            @if (!running()) {
              <ion-button expand="block" (click)="start()">
                <ion-icon slot="start" name="play-outline"></ion-icon> START LIVE PING
              </ion-button>
            }
            @if (times().length >= 2) {
              <div class="stats">
                <div><span class="cs-dim">AVG</span><b>{{ fmt(avg()) }}</b></div>
                <div><span class="cs-dim">MIN</span><b>{{ fmt(min()) }}</b></div>
                <div><span class="cs-dim">MAX</span><b>{{ fmt(max()) }}</b></div>
                <div><span class="cs-dim">JITTER</span><b>{{ fmt(jitter()) }}</b></div>
              </div>
              <div class="cs-dim" style="text-align:center;">ms · live session</div>
            }
          </div>

          <div class="cs-dim" style="text-align:center;">
            Continuous 1-packet probes while running. Sessions are saved to History automatically.
          </div>
        } @else {
          <div class="cs-card">
            <div class="hist-head">
              <h3>Saved sessions</h3>
              @if (store.pings$.value.length) {
                <ion-button size="small" fill="outline" (click)="clear()">Clear</ion-button>
              }
            </div>
            @for (s of store.pings$.value.slice().reverse(); track s.id) {
              <div class="sess">
                <div class="sess-top">
                  <b class="cs-mono">{{ s.host }}</b>
                  <span class="when">{{ dateOf(s.t) }}</span>
                </div>
                <div class="sess-stats">
                  <span><b>{{ s.avgMs != null ? s.avgMs.toFixed(1) : '—' }}</b> avg</span>
                  <span><b>{{ s.minMs != null ? s.minMs.toFixed(1) : '—' }}</b> min</span>
                  <span><b>{{ s.maxMs != null ? s.maxMs.toFixed(1) : '—' }}</b> max</span>
                  <span><b>{{ s.jitterMs != null ? s.jitterMs.toFixed(1) : '—' }}</b> jit</span>
                  <span class="cs-dim">{{ s.sent }} probes</span>
                </div>
              </div>
            } @empty {
              <div class="cs-empty">No ping sessions yet — run one in the Live tab</div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .seg { margin-bottom: 12px; --background: var(--cs-surface); border-radius: 12px; }
      .center { text-align: center; padding: 26px 12px; }
      .live-num { font-size: 64px; font-weight: 800; font-variant-numeric: tabular-nums;
                  font-family: var(--font-serif); line-height: 1; color: var(--cs-accent-fg); }
      .live-num.dim { color: var(--cs-bar-track); }
      .unit { color: var(--ion-color-medium); font-size: 13px; margin: 6px 0 10px; }
      .sent { margin-bottom: 12px; }
      .presets { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 0 12px; }
      .chip-btn { background: rgba(128,128,140,.15); border: none; color: var(--ion-text-color);
                  border-radius: 999px; padding: 5px 12px; font-size: 12px; cursor: pointer; }
      .stats { display: flex; justify-content: space-between; text-align: center; margin-top: 12px;
               border-top: 1px dashed var(--cs-border); padding-top: 12px; }
      .stats b { display: block; font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
      .hist-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .sess { padding: 10px 2px; border-bottom: 1px dashed var(--cs-border); }
      .sess:last-child { border-bottom: none; }
      .sess-top { display: flex; justify-content: space-between; font-size: 13px; }
      .when { color: var(--ion-color-medium); font-size: 11.5px; }
      .sess-stats { display: flex; gap: 14px; font-size: 12px; color: var(--ion-color-medium); margin-top: 4px; }
      .sess-stats b { color: var(--ion-text-color); font-variant-numeric: tabular-nums; }
    `
  ]
})
export class PingPage implements OnDestroy {
  tab = signal<'live' | 'history'>('live');
  host = '1.1.1.1';
  presets = ['1.1.1.1', '8.8.8.8', '9.9.9.9', '192.168.1.1'];
  running = signal(false);
  times = signal<number[]>([]);
  lastMs = signal<number | null>(null);

  private stopFlag = false;

  constructor(
    public native: NativeService,
    public store: StoreService,
    private toast: ToastController
  ) {
    addIcons({ playOutline, stopOutline });
  }

  ngOnDestroy(): void {
    this.stopFlag = true;
  }

  fmt(v: number | null): string {
    return v == null ? '—' : v.toFixed(1);
  }
  avg(): number | null {
    const t = this.times();
    return t.length ? t.reduce((a, b) => a + b, 0) / t.length : null;
  }
  min(): number | null {
    const t = this.times();
    return t.length ? Math.min(...t) : null;
  }
  max(): number | null {
    const t = this.times();
    return t.length ? Math.max(...t) : null;
  }
  jitter(): number | null {
    const t = this.times();
    if (t.length < 2) return null;
    const a = this.avg()!;
    return Math.sqrt(t.reduce((acc, x) => acc + (x - a) ** 2, 0) / t.length);
  }

  async start(): Promise<void> {
    const host = this.host.trim();
    if (!host || this.running()) return;
    this.running.set(true);
    this.stopFlag = false;
    this.times.set([]);
    this.lastMs.set(null);

    while (!this.stopFlag) {
      const r = await this.native.ping(host, 1, 56);
      if (this.stopFlag) break;
      if (r.ok && r.times.length) {
        this.times.update(list => [...list, r.times[0]].slice(-400));
        this.lastMs.set(r.times[0]);
      } else {
        this.lastMs.set(null);
      }
      await new Promise(res => setTimeout(res, 500));
    }

    const t = this.times();
    if (t.length >= 3) {
      const avg = t.reduce((a, b) => a + b, 0) / t.length;
      await this.store.addPing({
        id: `p${Date.now()}`,
        t: Date.now(),
        host,
        sent: t.length,
        avgMs: avg,
        minMs: Math.min(...t),
        maxMs: Math.max(...t),
        jitterMs: Math.sqrt(t.reduce((acc, x) => acc + (x - avg) ** 2, 0) / t.length),
        lossPct: 0,
        times: t.slice(-50)
      });
      this.toastMsg(`Session saved — ${t.length} probes to ${host}`);
    }
    this.running.set(false);
    this.times.set([]);
    this.lastMs.set(null);
  }

  stop(): void {
    this.stopFlag = true;
  }

  async clear(): Promise<void> {
    await this.store.clearPings();
  }

  dateOf(t: number): string {
    return new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private async toastMsg(m: string): Promise<void> {
    const t = await this.toast.create({ message: m, duration: 2200, position: 'bottom' });
    await t.present();
  }
}
