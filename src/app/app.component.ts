import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cellularOutline, gridOutline, layersOutline, radioOutline, speedometerOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, RouterOutlet, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-app>
      <ion-tabs>
        <ion-router-outlet></ion-router-outlet>
        <ion-tab-bar slot="bottom">
          <ion-tab-button tab="dashboard" href="/dashboard">
            <ion-icon aria-hidden="true" name="cellular-outline"></ion-icon>
            <ion-label>Signal</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="cells" href="/cells">
            <ion-icon aria-hidden="true" name="radio-outline"></ion-icon>
            <ion-label>Cells</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="spectrum" href="/spectrum">
            <ion-icon aria-hidden="true" name="layers-outline"></ion-icon>
            <ion-label>Bands</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="speed" href="/speed">
            <ion-icon aria-hidden="true" name="speedometer-outline"></ion-icon>
            <ion-label>Speed</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="more" href="/more">
            <ion-icon aria-hidden="true" name="grid-outline"></ion-icon>
            <ion-label>More</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </ion-tabs>
    </ion-app>
  `
})
export class AppComponent {
  constructor() {
    addIcons({ cellularOutline, radioOutline, layersOutline, speedometerOutline, gridOutline });
  }
}
