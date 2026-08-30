import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem,
  IonMenuButton, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gitNetworkOutline } from 'ionicons/icons';
import { NativeService } from '../services/native.service';
import { IpInfoService, enrichIp } from '../services/ipinfo.service';
import { TraceHop } from '../tracing';
import { FlagComponent } from '../components/flag.component';

interface RouteRow extends Partial<TraceHop> {
  hop: number;
  pending?: boolean;
}

@Component({
  selector: 'cs-route',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, FlagComponent, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent, IonItem, IonInput],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Route</ion-title>
        <ion-buttons slot="end"><ion-menu-button></ion-menu-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (native.devMode) { <div class="cs-badge dev">DEV MODE — SIMULATED ROUTE</div> }

        <div class="cs-card">
          <ion-item lines="none">
            <ion-input label="Destination" labelPlacement="stacked" [(ngModel)]="host" [disabled]="running()" (keyup.enter)="trace()"></ion-input>
          </ion-item>
          <div class="presets">
            @for (p of presets; track p) {
              <button class="chip-btn" type="button" [disabled]="running()" (click)="host = p; trace()">{{ p }}</button>
            }
          </div>
        </div>

        <div class="cs-card path-card">
          @if (error()) { <div class="cs-empty">{{ error() }}</div> }
          @else if (!rows().length) { <div class="cs-empty">Choose a destination to reveal the live network path.</div> }
          <div class="rail">
            @for (row of rows(); track row.hop; let last = $last) {
              <div class="hop" [class.pending]="row.pending" [class.last]="last && !row.pending">
                <div class="dot"></div>
                <div class="body">
                  <div class="top"><b>{{ row.hop }}</b><span class="cs-mono">{{ row.ip || (row.pending ? 'probing…' : '* * *') }}</span></div>
                  @if (row.hostname) { <div class="name">{{ row.hostname }}</div> }
                  @if (row.network) {
                    <div class="net"><span>{{ row.network }}</span>@if (row.asn) {<span class="asn">AS{{ row.asn }}</span>}</div>
                  }
                  @if (row.country) {
                    <div class="geo"><cs-flag [iso]="row.country" [size]="16"></cs-flag><span class="upper">{{ row.country }}</span></div>
                  }
                  @if (row.ms != null) { <div class="ms">{{ row.ms.toFixed(1)}} ms</div> }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .path-card { min-height:180px; }
    .rail { display:flex; flex-direction:column; }
    .hop { position:relative; display:flex; gap:14px; padding-bottom:22px; }
    .hop:last-child { padding-bottom:2px; }
    .dot { width:12px; height:12px; border-radius:50%; background:var(--cs-accent); margin-top:5px; flex:none;
           box-shadow:0 0 0 4px color-mix(in srgb,var(--cs-accent) 16%,transparent); animation:pulse 1.6s infinite; }
    .hop:not(.pending) .dot, .hop.last .dot { animation:none; }
    .hop::after { content:''; position:absolute; left:5.5px; top:18px; bottom:-1px; width:1px; background:var(--cs-border); }
    .hop:last-child::after { display:none; }
    .top { display:flex; align-items:center; gap:9px; font-size:15px; font-weight:650; }
    .top b { opacity:.45; font-size:13px; }
    .name { font-size:12px; color:var(--ion-color-medium); margin-top:3px; word-break:break-all; }
    .net { display:flex; align-items:center; gap:8px; margin-top:5px; font-size:12.5px; }
    .asn { padding:2px 7px; border-radius:999px; background:var(--cs-surface-2); font-size:10.5px; font-family:var(--font-mono); }
    .geo { display:flex; align-items:center; gap:6px; margin-top:5px; font-size:11px; color:var(--ion-color-medium); }
    .ms { margin-top:4px; font-size:12px; font-weight:600; color:var(--cs-ok); }
    .upper { text-transform:uppercase; letter-spacing:.05em; }
    .pending { opacity:.55; }
    @keyframes pulse { 50% { box-shadow:0 0 0 8px transparent; } }
    .chip-btn { background:rgba(128,128,140,.15); border:none; color:inherit; border-radius:999px; padding:5px 12px; font-size:12px; cursor:pointer; }
    .presets { display:flex; flex-wrap:wrap; gap:6px; padding:8px 0 2px; }
  `]
})
export class RoutePage implements OnDestroy {
  host = 'cloudflare.com';
  presets = ['cloudflare.com', 'google.com', '1.1.1.1', '9.9.9.9'];
  running = signal(false);
  rows = signal<RouteRow[]>([]);
  error = signal('');

  constructor(public native: NativeService, private ipdb: IpInfoService) {
    addIcons({ gitNetworkOutline });
  }

  ngOnDestroy(): void { this.running.set(false); }

  async trace(): Promise<void> {
    const target = this.host.trim();
    if (!target || this.running()) return;
    this.running.set(true);
    this.error.set('');
    this.rows.set([{ hop: 1, pending: true }]);
    await this.ipdb.ensureLoaded();

    const push = (hop: TraceHop | null): void => {
      if (!hop) return;
      let info = this.ipdb.lookup(hop.ip || '');
      const enriched = info ? enrichIp(info) : null;
      this.rows.update(list => [
        ...list.filter(row => row.hop !== hop.hop),
        { ...hop, network: enriched?.networkName ?? hop.network },
        { hop: hop.hop + 1, pending: true }
      ]);
    };

    try {
      await this.native.traceroute(target, push);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.rows.update(list => list.filter(row => !row.pending));
      this.running.set(false);
    }
  }
}
