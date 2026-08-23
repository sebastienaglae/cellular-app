import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cellularOutline, gridOutline, layersOutline, radioOutline, speedometerOutline
} from 'ionicons/icons';

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
          <ion-label>Signal</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/cells" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="radio-outline"></ion-icon>
          <ion-label>Cells</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/spectrum" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="layers-outline"></ion-icon>
          <ion-label>Bands</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/speed" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="speedometer-outline"></ion-icon>
          <ion-label>Speed</ion-label>
        </ion-tab-button>
        <ion-tab-button routerLink="/more" routerLinkActive="cs-tab-active">
          <ion-icon aria-hidden="true" name="grid-outline"></ion-icon>
          <ion-label>More</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-app>
  `,
  styles: [
    `
      .shell { flex: 1; position: relative; min-height: 0; }
      ion-router-outlet { position: absolute; top: 0; right: 0; bottom: 0; left: 0; }
    `
  ]
})
export class AppComponent {
  constructor() {
    addIcons({ cellularOutline, radioOutline, layersOutline, speedometerOutline, gridOutline });
  }
}
