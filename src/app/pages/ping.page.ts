import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem,
  IonLabel, IonList, IonMenuButton, IonNote, IonTitle, IonToolbar, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pulseOutline } from 'ionicons/icons';
import { NativeService } from '../services/native.service';
import { PingResult } from '../models';
import { SparklineComponent } from '../components/sparkline.component';

@Component({
  selector: 'cs-ping',
  standalone: true,
  imports: [
    FormsModule, SparklineComponent,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonNote
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ping</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (native.devMode) { <div class="cs-badge dev" style="margin-bottom:10px;">DEV MODE — simulated results</div> }

        <div class="cs-card">
          <ion-item lines="none">
            <ion-input label="Host / IP" labelPlacement="stacked" [(ngModel)]="host"></ion-input>
          </ion-item>
          <div class="presets">
            @for (p of presets; track p) {
              <button class="chip-btn" (click)="host = p">{{ p }}</button>
            }
          </div>
          <ion-button [disabled]="busy()" (click)="run()" expand="block">
            <ion-icon slot="start" name="pulse-outline"></ion-icon>
            {{ busy() ? 'Pinging…' : 'PING × 10' }}
          </ion-button>
        </div>

        @if (result(); as r) {
          <div class="cs-card">
            <h3>Result — {{ r.host }}</h3>
            @if (r.ok) {
              <div class="stats">
                <div><span class="cs-dim">AVG</span><br /><b>{{ r.avgMs }} ms</b></div>
                <div><span class="cs-dim">MIN</span><br /><b>{{ r.minMs }} ms</b></div>
                <div><span class="cs-dim">MAX</span><br /><b>{{ r.maxMs }} ms</b></div>
                <div><span class="cs-dim">JITTER</span><br /><b>{{ r.jitterMs }} ms</b></div>
              </div>
              <div class="cs-kv"><span class="k">Loss</span><span class="v">{{ r.lossPct }}% ({{ r.received }}/{{ r.transmitted }})</span></div>
              @if (r.ttl != null) { <div class="cs-kv"><span class="k">TTL</span><span class="v">{{ r.ttl }}</span></div> }
              <div style="height:64px; margin-top:8px;">
                <cs-sparkline [data]="r.times" color="#c9603f" />
              </div>
              <div class="cs-dim" style="text-align:center;">per-ping RTT (ms)</div>
            } @else {
              <div class="cs-empty">Ping failed<br /><small>{{ r.error }}</small></div>
            }
          </div>
        }

        <div class="cs-dim" style="text-align:center; margin-top:8px;">
          Uses the native ICMP ping binary on Android. No internet needed for LAN hosts.
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .presets { display:flex; flex-wrap:wrap; gap:6px; padding:6px 0 12px; }
      .chip-btn { background: rgba(148,163,184,.2); border:none; color: var(--ion-text-color);
                  border-radius:999px; padding:5px 12px; font-size:12px; cursor:pointer; }
      .stats { display:flex; justify-content:space-between; text-align:center; margin-bottom:10px; }
      .stats b { font-size:20px; font-weight:800; font-variant-numeric:tabular-nums; }
    `
  ]
})
export class PingPage {
  host = '1.1.1.1';
  presets = ['1.1.1.1', '8.8.8.8', '9.9.9.9', '192.168.1.1'];
  result = signal<PingResult | null>(null);
  busy = signal(false);

  constructor(public native: NativeService) {
    addIcons({ pulseOutline });
  }

  async run(): Promise<void> {
    this.busy.set(true);
    try {
      const r = await this.native.ping(this.host.trim(), 10, 56);
      this.result.set(r);
    } finally {
      this.busy.set(false);
    }
  }
}
