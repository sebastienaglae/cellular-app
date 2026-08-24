import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cellularOutline, gridOutline, layersOutline, radioOutline, speedometerOutline
} from 'ionicons/icons';
import { I18nService, Lang } from './services/i18n.service';
import { StoreService } from './services/store.service';
import { NativeService } from './services/native.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    IonApp, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel,
    RouterLink, RouterLinkActive
  ],
  template: `
    <ion-app>
      <div class="shell">
        <ion-router-outlet></ion-router-outlet>
      </div>
      <ion-tab-bar class="cs-tabbar" role="navigation">
        <ion-tab-button routerLink="/dashboard" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="cellular-outline"></ion-icon>
          <ion-label>{{ i18n.t('Signal') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/cells" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="radio-outline"></ion-icon>
          <ion-label>{{ i18n.t('Cells') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/spectrum" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="layers-outline"></ion-icon>
          <ion-label>{{ i18n.t('Bands') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/speed" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="speedometer-outline"></ion-icon>
          <ion-label>{{ i18n.t('Speed') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/more" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="grid-outline"></ion-icon>
          <ion-label>{{ i18n.t('More') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-app>
  `
})
export class AppComponent {
  i18n = inject(I18nService);
  private store = inject(StoreService);
  private native = inject(NativeService);

  constructor() {
    addIcons({ cellularOutline, radioOutline, layersOutline, speedometerOutline, gridOutline });

    this.store.init().then(() => {
      const saved = this.store.settings.lang;
      this.i18n.setLang((saved as Lang) || this.i18n.autoDetect());
      // dev mode survives restarts and swaps in the synthetic data world
      this.native.devMode = this.store.settings.devMode;
      this.store.setDevMode(this.store.settings.devMode);
    });
  }
}
