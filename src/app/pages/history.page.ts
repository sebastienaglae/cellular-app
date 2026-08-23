import { Component, OnInit, signal } from '@angular/core';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonMenuButton, IonNote, IonTitle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, trashOutline, shareOutline } from 'ionicons/icons';
import { StoreService, HistoryFile } from '../services/store.service';
import { MapViewComponent, MapMarker } from '../components/map-view.component';
import { SpeedResult } from '../models';

@Component({
  selector: 'cs-history',
  standalone: true,
  imports: [
    MapViewComponent,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>History &amp; Map</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="export()"><ion-icon name="share-outline" slot="icon-only"></ion-icon></ion-button>
          <ion-button (click)="clear()"><ion-icon name="trash-outline" slot="icon-only"></ion-icon></ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <div class="cs-card">
          <h3>Test locations (offline map)</h3>
          <cs-map style="height:260px; display:block;" [markers]="markers()" />
          @if (!markers().length) {
            <div class="cs-empty">No geo-tagged tests yet</div>
          }
        </div>

        <div class="cs-card">
          <h3>Saved tests ({{ tests().length }})</h3>
          <ion-list lines="none" style="background:transparent;">
            @for (t of tests().slice().reverse(); track t.id) {
              <ion-item>
                <div slot="start" class="dot" [style.background]="colorOf(t)"></div>
                <ion-label>
                  <h2 style="font-size:15px;">
                    {{ t.dlMbps?.toFixed(1) ?? '—' }} ↓ / {{ t.ulMbps?.toFixed(1) ?? '—' }} ↑ Mbps
                    @if (t.fake) { <span class="cs-badge dev" style="margin-left:6px;">FAKE</span> }
                  </h2>
                  <p style="font-size:12px;">
                    {{ dateOf(t.t) }} · {{ t.tech || '?' }} · {{ t.operator || '?' }}
                    @if (t.geo) { · 📍 {{ t.geo.lat.toFixed(4) }}, {{ t.geo.lon.toFixed(4) }} }
                  </p>
                </ion-label>
              </ion-item>
            } @empty {
              <div class="cs-empty">Run a speed test to start building history</div>
            }
          </ion-list>

          <input #fileInput type="file" accept="application/json,.json" hidden (change)="importFile($event)" />
          <ion-button fill="outline" size="small" expand="block" (click)="fileInput.click()">
            <ion-icon slot="start" name="download-outline"></ion-icon> Import export file
          </ion-button>
        </div>

        <ion-note style="font-size:11px; display:block; text-align:center;">
          Everything is stored locally on the device. Export produces a portable JSON backup.
        </ion-note>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .dot { width:14px; height:14px; border-radius:50%; }
    `
  ]
})
export class HistoryPage implements OnInit {
  tests = signal<SpeedResult[]>([]);
  markers = signal<MapMarker[]>([]);

  constructor(public store: StoreService, private toast: ToastController) {
    addIcons({ downloadOutline, trashOutline, shareOutline });
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

  async export(): Promise<void> {
    const data = JSON.stringify(this.store.buildExport(true), null, 2);
    try {
      await navigator.clipboard.writeText(data);
      await this.toastMsg('Export copied to clipboard');
    } catch {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CellScope history',
          text: 'CellScope speed test history',
          message: undefined,
          url: undefined,
          files: [new File([data], `cellscope-${Date.now()}.json`, { type: 'application/json' })]
        } as ShareData);
      } catch {}
    }
  }

  async importFile(ev: Event): Promise<void> {
    const inp = ev.target as HTMLInputElement;
    const f = inp.files?.[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const res = await this.store.importHistory(txt);
      this.reload();
      await this.toastMsg(`Imported ${res.tests} tests, ${res.countries} spectrum countries`);
    } catch (e) {
      await this.toastMsg(`Import failed: ${e}`);
    } finally {
      inp.value = '';
    }
  }

  async clear(): Promise<void> {
    await this.store.clearTests();
    this.reload();
    await this.toastMsg('History cleared');
  }

  dateOf(t: number): string {
    return new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  colorOf(t: SpeedResult): string {
    return colorForMbps(t.dlMbps);
  }

  private async toastMsg(m: string): Promise<void> {
    const t = await this.toast.create({ message: m, duration: 2400, position: 'bottom' });
    await t.present();
  }
}

function colorForMbps(v: number | null | undefined): string {
  if (v == null) return '#8a7f72';
  if (v >= 100) return '#4d7c4a';
  if (v >= 30) return '#7fa650';
  if (v >= 10) return '#c98a2b';
  if (v >= 3) return '#c9603f';
  return '#b64a33';
}
