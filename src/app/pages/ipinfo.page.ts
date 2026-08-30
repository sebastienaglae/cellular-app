import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonContent, IonHeader, IonIcon,
  IonTitle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOutline, downloadOutline, planetOutline, searchOutline } from 'ionicons/icons';
import { IpInfoService, IpInfo, enrichIp } from '../services/ipinfo.service';
import { NativeService } from '../services/native.service';
import { FlagComponent } from '../components/flag.component';

interface LookupRow {
  ip: string;
  label: string;
  info: IpInfo | null;
}

@Component({
  selector: 'cs-ipinfo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule, FlagComponent,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>IP / ISP</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (!svc.loaded()) {
          <div class="cs-card">
            <div class="cs-empty">
              Offline IP database not loaded yet.<br />
              {{ svc.loading() ? 'Preparing offline intelligence…' : 'Offline intelligence unavailable. Reopen to retry.' }}
            </div>
            @if (!svc.loading()) {
              <ion-button expand="block" (click)="load()">
                <ion-icon slot="start" name="download-outline"></ion-icon> Load offline DB (15.5 MB)
              </ion-button>
            }
          </div>
        }

        @if (svc.loaded()) {
          <div class="cs-card">
            <h3>Your connection</h3>
            @if (checking()) {
              <div class="cs-dim">Detecting public IP…</div>
            } @else if (!publicDetected()) {
              <div class="cs-dim">Offline — public IP unavailable right now.</div>
            }
            <div class="cs-dim" style="margin-top:4px;">
              Detection needs internet; the lookup itself is fully offline.
            </div>
          </div>

          @for (row of rows(); track row.ip + row.label) {
            <div class="cs-card">
              <h3>{{ row.label }}</h3>
              <div class="ip-line">{{ row.ip }}</div>
              @if (row.info; as i) {
                <div class="cs-kv">
                  <span class="k">Organisation</span>
                  <span class="v org">
                    @if (i.cc && i.cc.length === 2 && i.cc !== '--') { <cs-flag [iso]="i.cc" [size]="20"></cs-flag> }
                    {{ i.org }}
                  </span>
                </div>
                <div class="cs-kv"><span class="k">ASN</span><span class="v">{{ i.asn != null ? 'AS' + i.asn : '—' }}</span></div>
                <div class="cs-kv"><span class="k">Network</span><span class="v">{{ networkName(i) }}</span></div>
                <div class="cs-kv"><span class="k">Country</span><span class="v">{{ i.cc }}</span></div>
                @if (i.starlink) {
                  <div style="margin-top:8px;"><span class="cs-badge ok">STARLINK RANGE — AS14593</span></div>
                }
              } @else {
                <div class="cs-empty">No match in database (private or reserved range)</div>
              }
            </div>
          }

          <details class="cs-card compact-details">
            <summary><span><ion-icon name="planet-outline"></ion-icon> Starlink IP ranges</span><span>{{ starlinkRanges().length }}</span></summary>
            @for (r of starlinkRanges(); track r) {
              <div class="range cs-mono">{{ r }}</div>
            }
          </details>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .ip-line { font-size:18px; font-weight:700; font-family: ui-monospace, Menlo, Consolas, monospace; margin-bottom:6px; word-break:break-all; }
      .org { display:inline-flex; align-items:center; gap:8px; }
      .range { font-size:12px; padding:4px 0; border-bottom:1px dashed var(--cs-border); color:var(--ion-text-color); opacity:.82; }
      .compact-details summary { display:flex; align-items:center; justify-content:space-between; cursor:pointer; list-style:none; font-weight:700; }
      .compact-details summary span:first-child { display:flex; align-items:center; gap:8px; }
      .compact-details summary::-webkit-details-marker { display:none; }
      .compact-details[open] summary { margin-bottom:12px; }
    `
  ]
})
export class IpInfoPage implements OnInit {
  rows = signal<LookupRow[]>([]);
  checking = signal(false);
  publicDetected = signal(false);
  starlinkRanges = signal<string[]>([]);
  manualIp = '';

  constructor(
    public svc: IpInfoService,
    private native: NativeService,
    private toast: ToastController
  ) {
    addIcons({ cloudOutline, downloadOutline, searchOutline, planetOutline });
  }

  async ngOnInit(): Promise<void> {
    const loaded = await this.svc.ensureLoaded();
    if (loaded) {
      this.starlinkRanges.set(this.svc.starlinkRanges(15));
      this.checkPublic();
    }
  }

  networkName(info: IpInfo): string {
    return enrichIp(info).networkName;
  }

  async load(): Promise<void> {
    try {
      await this.svc.load();
      this.starlinkRanges.set(this.svc.starlinkRanges(15));
    } catch (e) {
      this.toastMsg('Load failed: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  async checkPublic(): Promise<void> {
    if (this.native.devMode) {
      const fakeIps = ['9.161.0.42', '45.134.244.10', '104.28.219.70'];
      const ip = fakeIps[Math.floor(Math.random() * fakeIps.length)];
      this.lookup(ip, 'Public (DEV FAKE)');
      return;
    }
    this.checking.set(true);
    try {
      const ip = await this.svc.publicIp();
      this.publicDetected.set(!!ip);
      if (ip) this.lookup(ip, 'Public');
    } finally {
      this.checking.set(false);
    }
  }

  async lookup(ip: string, label: string): Promise<void> {
    const trimmed = (ip || '').trim();
    if (!trimmed) return;
    // gateway/private IPs resolve to nothing by design; still show the attempt
    const info = this.svc.lookup(trimmed);
    this.rows.update(list => [{ ip: trimmed, label, info }, ...list.filter(r => r.label !== label)].slice(0, 4));
  }

  private async toastMsg(m: string): Promise<void> {
    const t = await this.toast.create({ message: m, duration: 2200, position: 'bottom' });
    await t.present();
  }
}
