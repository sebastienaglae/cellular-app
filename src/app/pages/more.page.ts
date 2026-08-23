import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonNote, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  globeOutline, mapOutline, peopleCircleOutline, pulseOutline,
  serverOutline, settingsOutline
} from 'ionicons/icons';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'cs-more',
  standalone: true,
  imports: [
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonIcon, IonLabel, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>More</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (store.settings$.value.devMode) {
          <div class="cs-badge dev" style="margin-bottom:12px;">DEV MODE — FAKE DATA</div>
        }

        <div class="section">Tools</div>
        <ion-list lines="none" class="more-list">
          <ion-item button routerLink="/operators">
            <ion-icon name="people-circle-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Operators / MVNO</h2>
              <p>Network, SIM &amp; virtual-operator analysis</p>
            </ion-label>
          </ion-item>
          <ion-item button routerLink="/ipinfo">
            <ion-icon name="server-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>IP / ISP</h2>
              <p>Who owns your IP — offline ASN database</p>
            </ion-label>
          </ion-item>
          <ion-item button routerLink="/ping">
            <ion-icon name="pulse-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Ping</h2>
              <p>Native ICMP latency &amp; jitter</p>
            </ion-label>
          </ion-item>
          <ion-item button routerLink="/ookla">
            <ion-icon name="globe-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Ookla Speedtest</h2>
              <p>Open speedtest.net in a protected tab</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <div class="section">Data</div>
        <ion-list lines="none" class="more-list">
          <ion-item button routerLink="/history">
            <ion-icon name="map-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>History &amp; Map</h2>
              <p>Saved tests on the offline OSM map</p>
            </ion-label>
          </ion-item>
          <ion-item button routerLink="/settings">
            <ion-icon name="settings-outline" slot="start"></ion-icon>
            <ion-label>
              <h2>Settings</h2>
              <p>Dev mode, endpoints, permissions</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-note class="foot">
          100% offline core · OSM tiles z0–4 · spectrum: spectrum-tracker.com · IP data: iptoasn.com
        </ion-note>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .section { font-family: var(--font-serif); font-size: 14px; opacity: .65; margin: 18px 4px 8px; }
      .more-list { background: transparent; border: 1px solid var(--cs-border); border-radius: 16px; overflow: hidden; }
      .more-list ion-item { --background: var(--cs-surface); }
      .more-list ion-item ion-label h2 { font-family: var(--font-serif); font-size: 16px; }
      .more-list ion-item ion-label p { font-size: 12px; color: var(--ion-color-medium); }
      ion-icon { color: var(--cs-accent-fg); }
      .foot { display: block; text-align: center; font-size: 11px; margin-top: 16px; }
    `
  ]
})
export class MorePage {
  constructor(public store: StoreService) {
    addIcons({ peopleCircleOutline, serverOutline, pulseOutline, globeOutline, mapOutline, settingsOutline });
  }
}
