import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonInput, IonItem, IonLabel, IonMenuButton, IonNote, IonTitle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOutline, downloadOutline, planetOutline, searchOutline } from 'ionicons/icons';
import { IpInfoService, IpInfo } from '../services/ipinfo.service';
import { NativeService } from '../services/native.service';

interface LookupRow {
  ip: string;
  label: string;
  info: IpInfo | null;
}

@Component({
  selector: 'cs-ipinfo',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
    IonButton, IonIcon, IonNote, IonItem, IonInput, IonBadge, IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>IP / ISP</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (!svc.loaded()) {
          <div class="cs-card">
            <div class="cs-empty">
              Offline IP database not loaded yet.<br />
              {{ svc.loading() ? 'Loading bundled database…' : 'Tap LOAD to enable lookups.' }}
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
            <h3><ion-icon name="cloud-outline"></ion-icon> Your connection</h3>
            <ion-button size="small" fill="outline" (click)="checkPublic()" [disabled]="checking()">
              {{ checking() ? 'Checking…' : 'Detect public IP' }}
            </ion-button>
            <div class="cs-dim" style="margin-top:4px;">Needs internet - lookup itself is fully offline.</div>
          </div>

          <div class="cs-card">
            <h3><ion-icon name="search-outline"></ion-icon> Lookup</h3>
            <ion-item lines="none">
              <ion-input label="Any IP" labelPlacement="stacked" [(ngModel)]="manualIp" placeholder="e.g. 9.161.0.10 or 2606:4700::1"></ion-input>
            </ion-item>
            <ion-button size="small" fill="outline" (click)="lookup(manualIp, 'Manual')">
              <ion-icon slot="start" name="search-outline"></ion-icon> Resolve
            </ion-button>
          </div>

          @for (row of rows(); track row.ip + row.label) {
            <div class="cs-card">
              <h3>{{ row.label }}</h3>
              <div class="ip-line">{{ row.ip }}</div>
              @if (row.info; as i) {
                <div class="cs-kv"><span class="k">Organisation</span><span class="v">{{ i.org }}</span></div>
                <div class="cs-kv"><span class="k">ASN</span><span class="v">{{ i.asn != null ? 'AS' + i.asn : '—' }}</span></div>
                <div class="cs-kv"><span class="k">Country</span><span class="v">{{ i.cc }}</span></div>
                @if (i.starlink) {
                  <div style="margin-top:8px;"><span class="cs-badge ok">★ STARLINK RANGE (AS14593)</span></div>
                }
              } @else {
                <div class="cs-empty">No match in database (private/reserved range?)</div>
              }
            </div>
          }

          <div class="cs-card">
            <h3><ion-icon name="planet-outline"></ion-icon> Starlink public ranges</h3>
            @if (starlinkRanges().length) {
              <div class="cs-dim" style="margin-bottom:6px;">AS14593 SPACEX-STARLINK blocks present in the loaded DB:</div>
              @for (r of starlinkRanges(); track r) {
                <div class="range cs-mono">{{ r }}</div>
              }
            } @else {
              <div class="cs-empty">None found in current DB version</div>
            }
          </div>

          <ion-note class="foot">
            Data: iptoasn.com (PDDL), bundled at build time. Refresh tools/build-ipdb.mjs to update.
          </ion-note>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .ip-line { font-size:18px; font-weight:700; font-family: ui-monospace, Menlo, Consolas, monospace; margin-bottom:6px; word-break:break-all; }
      .range { font-size:12px; padding:4px 0; border-bottom:1px dashed rgba(148,163,184,.2); color:#cfd6e4; }
      .foot { display:block; text-align:center; font-size:11px; margin-top:10px; }
    `
  ]
})
export class IpInfoPage implements OnInit {
  rows = signal<LookupRow[]>([]);
  checking = signal(false);
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
    await this.load();
    if (this.svc.isLoaded) {
      this.checkPublic();
    }
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
      if (ip) this.lookup(ip, 'Public');
      else this.toastMsg('Could not detect public IP (offline?)');
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
