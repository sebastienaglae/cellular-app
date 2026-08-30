import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonContent, IonHeader, IonIcon, IonLabel,
  IonSegment, IonSegmentButton, IonTitle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons';
import { flameOutline, locateOutline, radioOutline, trashOutline } from 'ionicons/icons';
import { StoreService } from '../services/store.service';
import { NativeService } from '../services/native.service';
import { I18nService } from '../services/i18n.service';
import { MapViewComponent, HeatPoint } from '../components/map-view.component';
import { HeatSample, bandColor, shouldSample } from '../utils/heat';
import { computeHeatPoints, bandsSeen, HeatMode } from '../utils/heatmap-vm';

@Component({
  selector: 'cs-heatmap',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, MapViewComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
    IonSegment, IonSegmentButton, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('Heatmap') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <div class="cs-card controls">
          <ion-segment [value]="mode()" (ionChange)="mode.set($any($event.detail.value))" class="seg">
            <ion-segment-button value="signal"><ion-label>{{ t('Signal') }}</ion-label></ion-segment-button>
            <ion-segment-button value="band"><ion-label>{{ t('Bands') }}</ion-label></ion-segment-button>
          </ion-segment>

          <div class="ctl-row">
            @if (!recording()) {
              <ion-button (click)="startSurvey()">
                <ion-icon slot="start" name="locate-outline"></ion-icon> {{ t('Record survey') }}
              </ion-button>
            } @else {
              <ion-button (click)="stopSurvey()">
                <ion-icon slot="start" name="flame-outline"></ion-icon> {{ t('Recording…') }} ({{ samples().length }})
              </ion-button>
            }
            <ion-button fill="outline" (click)="clear()">
              <ion-icon slot="start" name="trash-outline"></ion-icon> {{ t('Clear') }}
            </ion-button>
          </div>

          @if (mode() === 'signal') {
            <div class="legend">
              <span class="cs-dim">{{ t('Weak') }}</span>
              <span class="ramp"></span>
              <span class="cs-dim">{{ t('Strong') }}</span>
            </div>
          } @else {
            <div class="legend bands">
              @for (b of bandsSeen(); track b) {
                <span class="band-chip"><span class="swatch" [style.background]="colorForBand(b)"></span>{{ b }}</span>
              }
            </div>
          }
        </div>

        <div class="bigmap">
          <cs-map style="height: 100%; display: block;" [heat]="heatPoints()" [markers]="surveyMarker()" />
          @if (!samples().length) {
            <div class="map-empty cs-empty">{{ t('No samples yet — record a survey while moving around') }}</div>
          }
        </div>

        <div class="cs-dim" style="text-align:center; margin-top:8px;">
          {{ samples().length }} {{ t('samples') }} · {{ t('offline OSM basemap') }}
          @if (recording()) { · {{ t('survey records every few metres while you move') }} }
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .seg { margin-bottom: 12px; --background: var(--cs-surface); border-radius: 12px; }
      .ctl-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
      .legend { display: flex; align-items: center; gap: 10px; margin-top: 12px; font-size: 12px; }
      .legend .ramp { flex: 1; height: 10px; border-radius: 6px;
                      background: linear-gradient(90deg, rgb(182,66,45), rgb(214,116,67), rgb(222,178,74), rgb(96,158,102)); }
      .bands { flex-wrap: wrap; }
      .band-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 12px;
                   background: var(--cs-surface); border: 1px solid var(--cs-border);
                   border-radius: 999px; padding: 2px 9px; }
      .swatch { width: 10px; height: 10px; border-radius: 50%; }
      .bigmap { height: calc(100vh - 380px); min-height: 360px; border-radius: 16px; overflow: hidden;
                border: 1px solid var(--cs-border); position: relative; }
      .map-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
                   background: var(--cs-surface); z-index: 5; }
    `
  ]
})
export class HeatmapPage implements OnInit, OnDestroy {
  mode = signal<HeatMode>('signal');
  recording = signal(false);
  samples = signal<HeatSample[]>([]);
  private gpsLast: { lat: number; lon: number } | null = null;
  private timer?: number;

  t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);

  constructor(
    public store: StoreService,
    private native: NativeService,
    public i18n: I18nService,
    private toast: ToastController
  ) {}

  ngOnInit(): void {
    this.samples.set(this.store.heat$.value);
  }

  ngOnDestroy(): void {
    this.stopSurvey();
  }

  colorForBand(b: string): string {
    return bandColor(b);
  }

  bandsSeen(): string[] {
    return bandsSeen(this.samples());
  }

  heatPoints(): HeatPoint[] {
    return computeHeatPoints(this.samples(), this.mode(), this.bandFilter());
  }

  bandFilter(): string {
    return this._bandFilter;
  }
  setBandFilter(v: string): void {
    this._bandFilter = v;
  }
  private _bandFilter = '';

  surveyMarker(): HeatPoint[] {
    const g = this.gpsLast;
    return g ? [{ lat: g.lat, lon: g.lon, color: '#ffffff', size: 5 } as HeatPoint] : [];
  }

  async startSurvey(): Promise<void> {
    if (this.recording()) return;
    const ok = await this.native.checkPermissions();
    if (!ok.location) {
      await this.native.requestPermissions();
    }
    this.recording.set(true);
    this.gpsLast = null;
    this.tick();
    this.timer = window.setInterval(() => {
      if (!document.hidden) this.tick();
    }, 3000);
  }

  stopSurvey(): void {
    this.recording.set(false);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async tick(): Promise<void> {
    try {
      const pos = await Geolocation.getCurrentPosition({ timeout: 8000, enableHighAccuracy: true });
      const cur = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (!shouldSample(this.gpsLast, cur, 8)) return;
      this.gpsLast = cur;

      const snap = await this.native.snapshot();
      const serving = snap.cells.find(c => c.registered) || snap.cells[0] || null;
      const sample: HeatSample = {
        lat: cur.lat,
        lon: cur.lon,
        dbm: serving?.rsrp ?? serving?.dbm ?? null,
        band: serving?.bandLabel || null,
        tech: serving?.tech ?? null,
        t: Date.now()
      };
      this.store.addHeat(sample);
      this.samples.set(this.store.heat$.value);
    } catch {
      // GPS fix failed this tick - retry on next interval
    }
  }

  async clear(): Promise<void> {
    await this.store.clearHeat();
    this.samples.set([]);
    const t = await this.toast.create({ message: this.t('Heatmap cleared'), duration: 1600, position: 'bottom' });
    await t.present();
  }
}
