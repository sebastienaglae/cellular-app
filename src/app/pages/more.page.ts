import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonNote, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, flameOutline, gitNetworkOutline, globeOutline, mapOutline,
  peopleCircleOutline, pulseOutline, serverOutline, settingsOutline
} from 'ionicons/icons';
import { StoreService } from '../services/store.service';
import { I18nService } from '../services/i18n.service';

interface MoreLink {
  icon: string;
  title: string;
  sub: string;
  path: string;
}

@Component({
  selector: 'cs-more',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

        @for (group of groups; track group.title) {
          <div class="section">{{ i18n.t(group.title) }}</div>
          <ion-list lines="none" class="more-list">
            @for (l of group.links; track l.path) {
              <ion-item button routerLink="{{l.path}}" detail="false">
                <div class="tile" slot="start"><ion-icon name="{{l.icon}}"></ion-icon></div>
                <ion-label>
                  <h2>{{ i18n.t(l.title) }}</h2>
                </ion-label>
                <ion-icon class="chev" name="chevron-forward-outline" slot="end"></ion-icon>
              </ion-item>
            }
          </ion-list>
        }

        <ion-note class="foot">{{ i18n.t('100% offline core · OSM tiles z0–4 · spectrum: spectrum-tracker.com · IP data: iptoasn.com') }}</ion-note>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .section { font-size: 12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
                 color:var(--ion-color-medium); margin: 18px 6px 8px; }
      .more-list { background: var(--cs-surface); border: 1px solid var(--cs-border);
                   border-radius: 16px; overflow: hidden; margin: 0; padding: 4px 0; }
      .more-list ion-item { --background: transparent; --padding-start: 12px; --inner-padding-end: 10px;
                            --min-height: 56px; }
      .more-list ion-item h2 { font-size: 15px; font-weight: 650; letter-spacing:-.01em; }
      .tile { width: 38px; height: 38px; border-radius: 11px; background: var(--cs-accent-soft);
              display: flex; align-items: center; justify-content: center; margin-right: 12px; }
      .tile ion-icon { font-size: 20px; color: var(--cs-accent-fg); }
      .chev { color: var(--ion-color-medium); font-size: 15px; opacity: .6; }
      .foot { display: none; }
    `
  ]
})
export class MorePage {
  readonly groups = [
    {
      title: 'Tools',
      links: [
        { icon: 'people-circle-outline', title: 'Operators / MVNO', sub: 'Network, SIM & virtual-operator analysis', path: '/operators' },
        { icon: 'server-outline', title: 'IP / ISP', sub: 'Who owns your IP — offline ASN database', path: '/ipinfo' },
        { icon: 'pulse-outline', title: 'Ping', sub: 'Native ICMP latency & jitter', path: '/ping' },
        { icon: 'git-network-outline', title: 'Route', sub: 'Realtime hops, ASNs and countries', path: '/route' },
        { icon: 'flame-outline', title: 'Heatmap', sub: 'survey records every few metres while you move', path: '/heatmap' },
        { icon: 'globe-outline', title: 'Ookla Speedtest', sub: 'Open speedtest.net in a protected tab', path: '/ookla' }
      ]
    },
    {
      title: 'Data',
      links: [
        { icon: 'map-outline', title: 'History & Map', sub: 'Saved tests on the offline OSM map', path: '/history' },
        { icon: 'settings-outline', title: 'Settings', sub: 'Dev mode, endpoints, permissions', path: '/settings' }
      ]
    }
  ];

  constructor(public store: StoreService, public i18n: I18nService) {
    addIcons({
      peopleCircleOutline, serverOutline, pulseOutline, globeOutline,
      mapOutline, settingsOutline, chevronForwardOutline, flameOutline, gitNetworkOutline
    });
  }
}
