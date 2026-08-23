import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem,
  IonLabel, IonList, IonMenuButton, IonNote, IonSelect, IonSelectOption,
  IonTitle, IonToggle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { keyOutline } from 'ionicons/icons';
import { StoreService, AppSettings, DEFAULT_SETTINGS } from '../services/store.service';
import { NativeService } from '../services/native.service';
import { SpeedService } from '../services/speed.service';
import { CountrySpectrum } from '../data/spectrum';
import { MCC_COUNTRY } from '../data/plmn-db';

@Component({
  selector: 'cs-settings',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
    IonList, IonItem, IonLabel, IonToggle, IonInput, IonButton, IonIcon,
    IonNote, IonSelect, IonSelectOption
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <div class="cs-card">
          <h3><ion-icon name="key-outline"></ion-icon> Developer</h3>
          @if (!devMode) {
            <ion-item lines="none">
              <ion-input
                label="Unlock code" labelPlacement="stacked" type="password"
                placeholder="type 'dev' to unlock fake-data mode"
                [(ngModel)]="unlockCode"
              ></ion-input>
            </ion-item>
            <ion-note style="font-size:11px;">Dev mode replaces all modem/Wi-Fi/ping/speed data with realistic synthetic values.</ion-note>
          } @else {
            <div class="cs-badge dev">DEV MODE ACTIVE — FAKE DATA</div>
          }
        </div>

        <div class="cs-card">
          <h3>Permissions</h3>
          <div class="cs-dim" style="margin-bottom:8px;">
            Cell info needs Location + Phone permissions on Android. Wi-Fi SSID also needs location services ON.
          </div>
          <ion-button size="small" fill="outline" (click)="requestPerms()">Request permissions</ion-button>
        </div>

        <div class="cs-card">
          <h3>Monitoring</h3>
          <ion-item lines="none">
            <ion-toggle [ngModel]="s().devMode" (ngModelChange)="setDev($event)">Dev / fake-data mode</ion-toggle>
          </ion-item>
          <ion-item lines="none">
            <ion-select label="Country for spectrum" interface="popover" style="width:100%"
                        [ngModel]="s().countryOverride" (ngModelChange)="save({ countryOverride: $event })">
              <ion-select-option value="">(auto)</ion-select-option>
              @for (c of countries; track c.iso) {
                <ion-select-option [value]="c.iso">{{ c.name }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
        </div>

        <div class="cs-card">
          <h3>Speed endpoints (used online only)</h3>
          <ion-item lines="none">
            <ion-input label="Download URL" labelPlacement="stacked" [ngModel]="s().dlUrl" (ngModelChange)="save({ dlUrl: $event })"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-input label="Upload URL" labelPlacement="stacked" [ngModel]="s().ulUrl" (ngModelChange)="save({ ulUrl: $event })"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-input label="Ookla page URL" labelPlacement="stacked" [ngModel]="s().ooklaUrl" (ngModelChange)="save({ ooklaUrl: $event })"></ion-input>
          </ion-item>
          <div class="cs-dim pad8">Default: Cloudflare speed endpoints. Replace with any HTTP endpoint that streams bytes.</div>
        </div>

        <div class="cs-card">
          <h3>About</h3>
          <div class="cs-kv"><span class="k">App</span><span class="v">CellScope 1.1</span></div>
          <div class="cs-kv"><span class="k">Core features</span><span class="v">fully offline</span></div>
          <div class="cs-kv"><span class="k">Band/freq engine</span><span class="v">bundled 3GPP tables (36.101 / 38.104)</span></div>
          <div class="cs-kv"><span class="k">Map</span><span class="v">© OpenStreetMap tiles z0–4 (bundled)</span></div>
          <div class="cs-kv"><span class="k">Spectrum</span><span class="v">spectrum-tracker.com · bundled snapshot</span></div>
          <div class="cs-kv"><span class="k">IP database</span><span class="v">iptoasn.com · PDDL</span></div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .pad8 { padding:0 8px 4px; }
    `
  ]
})
export class SettingsPage implements OnInit {
  unlockCode = '';
  s = signal<AppSettings>({ ...DEFAULT_SETTINGS });
  devMode = false;
  readonly countries = Object.entries(MCC_COUNTRY)
    .map(([, v]) => ({ iso: v[1], name: v[0] }))
    .filter((c, i, arr) => arr.findIndex(x => x.iso === c.iso) === i)
    .sort((a, b) => a.name.localeCompare(b.name));

  constructor(
    public store: StoreService,
    private native: NativeService,
    private speed: SpeedService,
    private toast: ToastController
  ) {
    addIcons({ keyOutline });
  }

  ngOnInit(): void {
    this.devMode = this.store.settings.devMode;
    this.store.settings$.subscribe(s => this.s.set({ ...s }));
  }

  async save(patch: Partial<AppSettings>): Promise<void> {
    await this.store.saveSettings(patch);
  }

  async setDev(on: boolean): Promise<void> {
    if (on && !this.native.devMode && this.unlockCode.trim().toLowerCase() !== 'dev') {
      await this.toastMsg('Wrong unlock code');
      return;
    }
    this.native.devMode = on;
    await this.save({ devMode: on });
    await this.toastMsg(on ? 'DEV MODE ON — showing fake data' : 'Dev mode off');
  }

  async requestPerms(): Promise<void> {
    const ok = await this.native.requestPermissions();
    const geoOk = await this.speed.ensureGeoPermission();
    await this.toastMsg(`Cell perms: ${ok ? 'granted' : 'denied'} · Location: ${geoOk ? 'granted' : 'denied'}`);
  }

  private async toastMsg(m: string): Promise<void> {
    const t = await this.toast.create({ message: m, duration: 2200, position: 'bottom' });
    await t.present();
  }
}
