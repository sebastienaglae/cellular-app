import { Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonChip, IonContent, IonHeader, IonIcon,
  IonLabel, IonNote, IonRefresher, IonRefresherContent,
  IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline, locationOutline, wifiOutline
} from 'ionicons/icons';
import { NativeService, Snapshot } from '../services/native.service';
import { StoreService } from '../services/store.service';
import { SpeedService } from '../services/speed.service';
import { detectStarlink } from '../data/starlink';
import { fmtMhz } from '../data/bands';
import { SignalBarsComponent } from '../components/signal-bars.component';
import { SparklineComponent } from '../components/sparkline.component';
import { MapViewComponent, MapMarker } from '../components/map-view.component';
import { FlagComponent } from '../components/flag.component';

@Component({
  selector: 'cs-dashboard',
  standalone: true,
  imports: [
    SignalBarsComponent, SparklineComponent, RouterLink, MapViewComponent, FlagComponent,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
    IonRefresher, IonRefresherContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonChip, IonBadge, IonIcon, IonNote,
    IonButton, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>CellScope</ion-title>
        <ion-buttons slot="end">
          @if (snap()?.fake) { <span class="cs-badge dev" style="margin-right:8px;">FAKE</span> }
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="cs-page">
        @if (showPermCard()) {
          <div class="cs-card perm-card">
            <h3>Permissions needed</h3>
            <p class="perm-text">
              CellScope reads everything directly from your phone — no cloud, nothing leaves the device.
            </p>
            <ul class="perm-list">
              <li><b>Location</b> — required by Android to scan nearby cells and place you on the map.</li>
              <li><b>Phone</b> — operator name, PLMN codes and SIM details (MVNO detection).</li>
              <li><b>Nearby devices</b> — Wi-Fi name and signal of the network you use.</li>
            </ul>
            <div class="perm-actions">
              <ion-button size="small" [disabled]="permBusy()" (click)="grantPerms()">
                {{ permBusy() ? 'Asking…' : 'Grant access' }}
              </ion-button>
              <ion-button size="small" fill="outline" [disabled]="permBusy()" (click)="laterPerms()">Later</ion-button>
            </div>
            @if (permMsg()) { <div class="cs-dim" style="margin-top:8px;">{{ permMsg() }}</div> }
          </div>
        }

        @if (starlink().level !== 'none') {
          <div class="cs-card" [style.border-color]="'#7d5fff'">
            <h3><ion-icon name="alert-circle-outline"></ion-icon> Satellite / Starlink</h3>
            <div style="font-weight:700; margin-bottom:4px;">
              {{ starlink().level === 'confirmed' ? 'Starlink link detected' : 'Possible satellite connection (' + starlink().level + ')' }}
            </div>
            <ul class="reasons">
              @for (r of starlink().reasons; track $index) { <li>{{ r }}</li> }
            </ul>
          </div>
        }

        <div class="cs-card">
          <h3>Serving cell</h3>
          @if (serving(); as s) {
            <div class="serving-head">
              <span class="tech-badge">{{ s.tech }}</span>
              @if (nrMode()) {
                <span class="cs-badge ok">5G {{ nrMode() }}</span>
              }
              @if (snap()?.service?.carrierAggregation) { <span class="cs-badge">CA</span> }
              @if (snap()?.service?.iwlanPreferred) { <span class="cs-badge">VoWiFi</span> }
              @if (snap()?.service?.roaming) { <span class="cs-badge warn">Roaming</span> }
              <span style="flex:1"></span>
              <cs-signal-bars [dbm]="s.dbm ?? s.rsrp"></cs-signal-bars>
            </div>
            <div class="kv-row">
              <div><span class="cs-dim">Band</span><br /><b>{{ s.bandLabel || '?' }}</b></div>
              <div><span class="cs-dim">DL freq</span><br /><b>{{ fmtMhz(s.freqDlMhz) }}</b></div>
              <div><span class="cs-dim">UL freq</span><br /><b>{{ fmtMhz(s.freqUlMhz) }}</b></div>
            </div>
            <div class="kv-row">
              <div><span class="cs-dim">RSRP</span><br /><b>{{ s.rsrp ?? '—' }} dBm</b></div>
              <div><span class="cs-dim">RSRQ</span><br /><b>{{ s.rsrq ?? '—' }} dB</b></div>
              <div><span class="cs-dim">SINR</span><br /><b>{{ s.sinr ?? '—' }} dB</b></div>
            </div>
            <div class="kv-row">
              <div><span class="cs-dim">PCI</span><br /><b>{{ s.pci ?? '—' }}</b></div>
              <div><span class="cs-dim">TAC</span><br /><b>{{ s.tac ?? '—' }}</b></div>
              <div><span class="cs-dim">CID</span><br /><b>{{ s.cid ?? '—' }}</b></div>
            </div>
            @if (rsrpHist().length > 2) {
              <div class="chart-box"><cs-sparkline [data]="rsrpHist()" color="#4d7c4a" [fill]="true" /></div>
              <div class="cs-dim" style="text-align:center;">RSRP trend (last {{ rsrpHist().length }} samples)</div>
            }
          } @else if (!loading()) {
            <div class="cs-empty">No cell info.<br />Grant location & phone permissions in Settings.</div>
          } @else {
            <div class="cs-empty">Reading modem…</div>
          }
        </div>

        <div class="cs-grid2">
          <div class="cs-card">
            <h3>Operator</h3>
            @if (snap(); as sp) {
              <div class="op-row">
                @if (sp.service.isoCountry) { <cs-flag [iso]="sp.service.isoCountry" [size]="26"></cs-flag> }
                <span class="op-name">{{ sp.service.operatorName || 'Unknown' }}</span>
              </div>
              <div class="cs-kv"><span class="k">PLMN</span><span class="v cs-mono">{{ plmn() || '—' }}</span></div>
              <div class="cs-kv"><span class="k">Data tech</span><span class="v">{{ sp.service.dataTech }}{{ nrMode() ? '-' + nrMode() : '' }}</span></div>
              <div class="cs-kv"><span class="k">Country</span><span class="v">{{ (sp.service.isoCountry || '—').toUpperCase() }}</span></div>
            }
          </div>
          <div class="cs-card">
            <h3><ion-icon name="wifi-outline"></ion-icon> Wi-Fi</h3>
            @if (wifi(); as w) {
              <div class="op-name">{{ w.ssid || '&lt;hidden&gt;' }}</div>
              <div class="cs-kv"><span class="k">Band</span><span class="v">{{ w.bandLabel || '—' }} @if (w.frequencyMhz) {({{ w.frequencyMhz }} MHz)}</span></div>
              <div class="cs-kv"><span class="k">RSSI</span><span class="v">{{ w.rssi ?? '—' }} dBm</span></div>
              <div class="cs-kv"><span class="k">Link</span><span class="v">{{ w.linkSpeedMbps ?? '—' }} Mbps</span></div>
            } @else {
              <div class="cs-empty">Not connected / no data</div>
            }
          </div>
        </div>

        <div class="cs-card">
          <h3><ion-icon name="location-outline"></ion-icon> Position</h3>
          @if (gps(); as g) {
            <div class="kv-row">
              <div><span class="cs-dim">Latitude</span><br /><b>{{ g.lat.toFixed(5) }}</b></div>
              <div><span class="cs-dim">Longitude</span><br /><b>{{ g.lon.toFixed(5) }}</b></div>
              <div><span class="cs-dim">Accuracy</span><br /><b>±{{ g.acc != null ? g.acc.toFixed(0) : '—' }} m</b></div>
            </div>
            <div class="kv-row">
              <div><span class="cs-dim">Altitude</span><br /><b>{{ g.alt != null ? g.alt.toFixed(0) + ' m' : '—' }}</b></div>
              <div><span class="cs-dim">Speed</span><br /><b>{{ g.speed != null ? (g.speed * 3.6).toFixed(1) + ' km/h' : '—' }}</b></div>
              <div><span class="cs-dim">Heading</span><br /><b>{{ g.head != null ? g.head.toFixed(0) + '°' : '—' }}</b></div>
            </div>
            <cs-map style="height: 175px; display: block; margin-top: 12px;" [markers]="gpsMarker()" />
            <div class="cs-dim" style="text-align:center; margin-top:6px;">Live position · offline OSM basemap</div>
          } @else {
            <div class="cs-empty">{{ gpsError() || 'Waiting for GPS fix…' }}</div>
          }
        </div>

        <div class="cs-card" style="display:flex; gap:10px; align-items:center;">
          <ion-button size="small" fill="outline" routerLink="/cells">All cells ({{ cellsCount() }})</ion-button>
          <ion-button size="small" fill="outline" routerLink="/speed">Speed test</ion-button>
          <ion-button size="small" fill="outline" routerLink="/ping">Ping</ion-button>
        </div>

        @if (lastError()) {
          <ion-note color="danger">{{ lastError() }}</ion-note>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .serving-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap; }
      .tech-badge { font-weight:800; font-size:18px; letter-spacing:.02em; }
      .kv-row { display:flex; justify-content:space-between; gap:6px; padding:6px 0; border-bottom:1px dashed rgba(148,163,184,.2); }
      .kv-row:last-of-type { border-bottom:none; }
      .kv-row > div { flex:1; text-align:center; }
      .op-row { display: flex; align-items: center; gap: 9px; margin-bottom: 8px; }
      .op-name { font-size: 17px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chart-box { height:52px; margin-top:10px; }
      ul.reasons { margin:4px 0 0 18px; padding:0; font-size:12.5px; color:var(--ion-color-medium); }
      ul.reasons li { margin-bottom:2px; }
      .perm-card { border-color: var(--cs-accent); }
      .perm-text { font-size: 13px; margin: 0 0 10px; color: var(--ion-color-medium); }
      .perm-list { margin: 0 0 12px; padding-left: 4px; list-style: none; font-size: 12.5px; line-height: 1.5; }
      .perm-list li { margin-bottom: 8px; }
      .perm-list b { font-weight: 600; }
      .perm-actions { display: flex; gap: 10px; }
    `
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  snap = signal<Snapshot | null>(null);
  loading = signal(true);
  lastError = signal('');
  rsrpHist = signal<(number | null)[]>([]);
  starlink = signal<ReturnType<typeof detectStarlink>>({ level: 'none', score: 0, ntnFlag: false, nameMatch: false, dtcPartner: null, ssidMatch: false, ouiMatch: false, reasons: [] });
  gps = signal<{ lat: number; lon: number; alt: number | null; speed: number | null; acc: number | null; head: number | null } | null>(null);
  gpsError = signal('');
  showPermCard = signal(false);
  permMsg = signal('');
  permBusy = signal(false);

  private timer?: number;
  private gpsWatch?: string;

  constructor(
    private native: NativeService,
    private zone: NgZone,
    private store: StoreService,
    private speedSrv: SpeedService,
    public router: Router
  ) {
    addIcons({ wifiOutline, alertCircleOutline, locationOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.refresh();
    this.timer = window.setInterval(() => {
      if (document.hidden) return;
      this.zone.runOutsideAngular(() => {
        this.native.snapshot().then(s => this.zone.run(() => {
          this.snap.set(s);
          const srv = s.cells.find(c => c.registered);
          const v = srv?.rsrp ?? srv?.dbm ?? null;
          if (srv) {
            const hist = [...this.rsrpHist(), v].slice(-90);
            this.rsrpHist.set(hist);
          }
        }));
      });
    }, this.store.settings.pollMs);
    this.initGps();
    this.maybeShowPermCard();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.gpsWatch != null) {
      Geolocation.clearWatch({ id: this.gpsWatch }).catch(() => {});
    }
  }

  private async initGps(): Promise<void> {
    try {
      this.gpsWatch = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 },
        pos => {
          if (!pos) return;
          this.zone.run(() => {
            const c = pos.coords;
            this.gps.set({
              lat: c.latitude,
              lon: c.longitude,
              alt: c.altitude,
              speed: c.speed,
              acc: c.accuracy,
              head: c.heading
            });
          });
        }
      );
    } catch {
      this.gpsError.set('GPS unavailable (permission denied?)');
    }
  }

  gpsMarker(): MapMarker[] {
    const g = this.gps();
    return g ? [{ lat: g.lat, lon: g.lon, color: '#d97757', size: 7, label: 'you' }] : [];
  }

  private async maybeShowPermCard(): Promise<void> {
    const p = await this.native.checkPermissions();
    if (p.location && p.phone) {
      // already granted - never bother the user again
      if (!this.store.settings.permsAsked) {
        await this.store.saveSettings({ permsAsked: true });
      }
      return;
    }
    if (this.store.settings.permsAsked) return;
    this.showPermCard.set(true);
  }

  async grantPerms(): Promise<void> {
    this.permBusy.set(true);
    try {
      const cell = await this.native.requestPermissions();
      const geo = await this.speedSrv.ensureGeoPermission();
      this.permMsg.set(`Phone: ${cell ? 'granted' : 'denied'} · Location: ${geo ? 'granted' : 'denied'}`);
      await this.store.saveSettings({ permsAsked: true });
      setTimeout(() => this.showPermCard.set(false), 2600);
    } finally {
      this.permBusy.set(false);
    }
  }

  async laterPerms(): Promise<void> {
    await this.store.saveSettings({ permsAsked: true });
    this.showPermCard.set(false);
  }

  async refresh(ev?: CustomEvent): Promise<void> {
    try {
      const s = await this.native.snapshot();
      this.snap.set(s);
      const srv = s.cells.find(c => c.registered);
      if (srv) this.rsrpHist.set([srv.rsrp]);
      this.starlink.set(
        detectStarlink({
          ntnFlag: s.service.ntn,
          operatorNumeric: s.service.operatorNumeric,
          operatorName: s.service.operatorName,
          wifiSsid: s.wifi?.ssid,
          wifiBssid: s.wifi?.bssid
        })
      );
    } catch (e: unknown) {
      this.lastError.set(String(e));
    } finally {
      this.loading.set(false);
      if (ev) (ev as CustomEvent).detail.complete();
    }
  }

  serving() {
    return this.snap()?.cells.find(c => c.registered) || this.snap()?.cells[0] || null;
  }
  nrMode(): string | null {
    return this.snap()?.service.nrMode || null;
  }
  plmn(): string | null {
    const n = this.snap()?.service.operatorNumeric;
    return n && n.length >= 5 ? `${n.slice(0, 3)}-${n.slice(3)}` : null;
  }
  cellsCount(): number {
    return this.snap()?.cells.length || 0;
  }
  wifi() {
    return this.snap()?.wifi || null;
  }
  protected readonly fmtMhz = fmtMhz;
}
