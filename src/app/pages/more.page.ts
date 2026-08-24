import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonNote, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, flameOutline, globeOutline, mapOutline, peopleCircleOutline,
  pulseOutline, serverOutline, settingsOutline
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
                  <p>{{ i18n.t(l.sub) }}</p>
                </ion-label>
                <ion-icon class="chev" name="chevron-forward-outline" slot="end"></ion-icon>
              </ion-item>
            }
          </ion-list>
        }

        <ion-note class="foot">
          100% offline core · OSM tiles z0–4 · spectrum: spectrum-tracker.com · IP data: iptoasn.com
        </ion-note>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .section { font-family: var(--font-serif); font-size: 14px; opacity: 0.6; margin: 20px 6px 8px; }
      .more-list { background: var(--cs-surface); border: 1px solid var(--cs-border);
                   border-radius: 16px; overflow: hidden; margin: 0; padding: 4px 0; }
      .more-list ion-item { --background: transparent; --padding-start: 12px; --inner-padding-end: 10px;
                            --min-height: 60px; }
      .more-list ion-item h2 { font-family: var(--font-serif); font-size: 16px; font-weight: 600; }
      .more-list ion-item p { font-size: 12px; color: var(--ion-color-medium); white-space: normal; }
      .tile { width: 38px; height: 38px; border-radius: 11px; background: var(--cs-accent-soft);
              display: flex; align-items: center; justify-content: center; margin-right: 12px; }
      .tile ion-icon { font-size: 20px; color: var(--cs-accent-fg); }
      .chev { color: var(--ion-color-medium); font-size: 15px; opacity: .6; }
      .foot { display: block; text-align: center; font-size: 11px; margin: 18px 0 6px; line-height: 1.6; }
    `
  ]
})
export class MorePage {
  readonly groups = [
    {
      title: 'Tools',
      links: [
        { icon: 'people-circle-outline', title: 'Operators / MVNO', sub: 'more.ops.sub', path: '/operators' },
        { icon: 'server-outline', title: 'IP / ISP', sub: 'more.ip.sub', path: '/ipinfo' },
        { icon: 'pulse-outline', title: 'Ping', sub: 'more.ping.sub', path: '/ping' },
        { icon: 'flame-outline', title: 'Heatmap', sub: 'more.heat.sub', path: '/heatmap' },
        { icon: 'globe-outline', title: 'Ookla Speedtest', sub: 'more.ookla.sub', path: '/ookla' }
      ]
    },
    {
      title: 'Data',
      links: [
        { icon: 'map-outline', title: 'History & Map', sub: 'more.hist.sub', path: '/history' },
        { icon: 'settings-outline', title: 'Settings', sub: 'more.settings.sub', path: '/settings' }
      ]
    }
  ];

  constructor(public store: StoreService, public i18n: I18nService) {
    addIcons({
      peopleCircleOutline, serverOutline, pulseOutline, globeOutline,
      mapOutline, settingsOutline, chevronForwardOutline, flameOutline
    });
  }
}
