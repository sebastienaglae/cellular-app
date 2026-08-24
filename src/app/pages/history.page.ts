import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { StoreService } from '../services/store.service';
import { MapViewComponent, MapMarker } from '../components/map-view.component';
import { SpeedResult } from '../models';
import { movementText } from '../utils/geo';
import { colorForMbps } from '../utils/view';

@Component({
  selector: 'cs-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MapViewComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonSegment, IonSegmentButton, IonList, IonItem, IonLabel,
    IonButton, IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>History</ion-title>
        <ion-buttons slot="end">
          @if (tab() === 'list' && tests().length) {
            <ion-button (click)="clear()"><ion-icon name="trash-outline" slot="icon-only"></ion-icon></ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))" class="seg">
          <ion-segment-button value="list"><ion-label>Tests</ion-label></ion-segment-button>
          <ion-segment-button value="map"><ion-label>Map</ion-label></ion-segment-button>
        </ion-segment>

        @if (tab() === 'map') {
          <div class="bigmap">
            <cs-map style="height: 100%; display: block;" [markers]="markers()" />
            @if (!markers().length) {
              <div class="map-empty cs-empty">No geo-tagged tests yet</div>
            }
          </div>
          <div class="cs-dim" style="text-align:center; margin-top:8px;">
            {{ markers().length }} locations · offline OSM basemap · pinch to zoom
          </div>
        } @else {
          <ion-list lines="none" class="test-list">
            @for (t of tests().slice().reverse(); track t.id; let i = $index) {
              <div class="test">
                <div class="test-head">
                  <span class="dot" [style.background]="colorOf(t)"></span>
                  <b class="dl">{{ t.dlMbps?.toFixed(1) ?? '—' }}</b>
                  <span class="mbps">Mbps</span>
                  @if (t.ulMbps != null) { <span class="up">{{ t.ulMbps.toFixed(1) }} up</span> }
                  @if (t.fake) { <span class="cs-badge dev" style="margin-left:auto;">FAKE</span> }
                </div>
                <div class="test-meta">
                  {{ dateOf(t.t) }} · {{ t.tech || '?' }} · {{ t.operator || '?' }}
                </div>
                @if (t.geo) {
                  <div class="test-meta cs-mono">
                    {{ t.geo.lat.toFixed(4) }}, {{ t.geo.lon.toFixed(4) }}
                    @if (movedText(t); as mv) { · {{ mv }} }
                  </div>
                }
                @if (t.latencyMs != null) {
                  <div class="test-meta">{{ t.latencyMs.toFixed(0) }} ms latency</div>
                }
              </div>
            } @empty {
              <div class="cs-empty">Run a speed test to start building history</div>
            }
          </ion-list>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .seg { margin-bottom: 12px; --background: var(--cs-surface); border-radius: 12px; }
      .bigmap { height: calc(100vh - 230px); min-height: 420px; border-radius: 16px; overflow: hidden;
                border: 1px solid var(--cs-border); position: relative; }
      .map-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
                   background: var(--cs-surface); z-index: 5; }
      .test-list { background: transparent; padding: 0; }
      .test { background: var(--cs-surface); border: 1px solid var(--cs-border); border-radius: 14px;
              padding: 12px 14px; margin-bottom: 10px; }
      .test-head { display: flex; align-items: baseline; gap: 7px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; align-self: center; }
      .dl { font-size: 24px; font-weight: 800; font-variant-numeric: tabular-nums;
            font-family: var(--font-serif); }
      .mbps { color: var(--ion-color-medium); font-size: 12px; }
      .up { font-size: 12px; color: var(--cs-ok-fg); margin-left: 4px; }
      .test-meta { font-size: 12px; color: var(--ion-color-medium); margin-top: 3px; }
    `
  ]
})
export class HistoryPage implements OnInit {
  tab = signal<'list' | 'map'>('list');
  tests = signal<SpeedResult[]>([]);
  markers = signal<MapMarker[]>([]);

  constructor(public store: StoreService, private toast: ToastController) {
    addIcons({ trashOutline });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const t = this.store.tests$.value;
    this.tests.set(t);
    this.markers.set(
      t
        .filter(x => x.geo)
        .map((x): MapMarker => ({
          lat: x.geo!.lat,
          lon: x.geo!.lon,
          color: colorForMbps(x.dlMbps),
          label: `${x.dlMbps?.toFixed(0)}M`,
          size: 5 + Math.min(8, Math.log10(Math.max(1, x.dlMbps || 1)) * 3)
        }))
    );
  }

  movedText(t: SpeedResult): string | null {
    const tests = this.store.tests$.value;
    const idx = tests.findIndex(x => x.id === t.id);
    if (idx <= 0) return 'start point';
    const prev = tests[idx - 1];
    return movementText(prev.geo, t.geo);
  }

  async clear(): Promise<void> {
    await this.store.clearTests();
    this.reload();
    const t = await this.toast.create({ message: 'History cleared', duration: 1800, position: 'bottom' });
    await t.present();
  }

  dateOf(t: number): string {
    return new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  colorOf(t: SpeedResult): string {
    return colorForMbps(t.dlMbps);
  }
}
