import { Component, inject, signal } from '@angular/core';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonNote, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { Browser } from '@capacitor/browser';
import { addIcons } from 'ionicons';
import { openOutline, speedometerOutline } from 'ionicons/icons';
import { StoreService } from '../services/store.service';
import { NativeService } from '../services/native.service';

/**
 * speedtest.net sends X-Frame-Options / CSP frame-ancestors, so embedding it
 * in a WebView iframe is blocked by the site itself (ERR_BLOCKED_BY_RESPONSE).
 * We therefore hand off to the Chrome Custom Tab - full Ookla experience,
 * still launched from inside CellScope.
 */
@Component({
  selector: 'cs-ookla',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonContent,
    IonButton, IonIcon, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          @if (native.devMode) { <span class="cs-badge dev" style="margin-left:8px;">FAKE</span> }
        </ion-buttons>
        <ion-title>Ookla Speedtest</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="hero">
        <div class="mark"><ion-icon name="speedometer-outline"></ion-icon></div>
        <h1>Run the official Ookla test</h1>
        <p class="sub">
          speedtest.net refuses to be embedded inside other apps
          (ERR_BLOCKED_BY_RESPONSE), so CellScope opens it in a secure
          in-app browser tab instead. Results stay between you and Ookla.
        </p>
        <ion-button size="large" (click)="open(store.settings.ooklaUrl)">
          <ion-icon slot="start" name="open-outline"></ion-icon>
          Open speedtest.net
        </ion-button>
        <ion-button size="small" fill="outline" (click)="open('https://fast.com')">
          fast.com (Netflix) alternative
        </ion-button>
        <ion-note class="hint">
          For fully offline-logged tests use the built-in Speed tab —
          it saves results with GPS, band and operator on this device.
        </ion-note>
        @if (lastFake()) {
          <div class="cs-badge dev" style="margin-top:14px;">DEV MODE — real site still opens, fake numbers live in the Speed tab</div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .hero { min-height:100%; display:flex; flex-direction:column; align-items:center;
              justify-content:center; text-align:center; padding:28px 26px; }
      .mark { width:86px; height:86px; border-radius:24px; background:var(--cs-accent-soft);
              display:flex; align-items:center; justify-content:center; margin-bottom:18px; }
      .mark ion-icon { font-size:44px; color:var(--cs-accent-fg); }
      h1 { font-size:24px; margin:0 0 10px; }
      .sub { color:var(--ion-color-medium); font-size:14px; line-height:1.55; margin:0 0 24px; }
      .hint { font-size:11.5px; margin-top:18px; }
      ion-button { margin-bottom:10px; }
    `
  ]
})
export class OoklaPage {
  public store = inject(StoreService);
  public native = inject(NativeService);
  lastFake = signal(false);

  constructor() {
    addIcons({ openOutline, speedometerOutline });
  }

  async open(url: string): Promise<void> {
    try {
      await Browser.open({ url });
    } catch {
      window.open(url, '_blank');
    }
  }
}
