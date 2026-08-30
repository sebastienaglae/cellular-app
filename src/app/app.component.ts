import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonIcon, IonRouterOutlet } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cellularOutline, gridOutline, layersOutline, radioOutline, speedometerOutline } from 'ionicons/icons';
import { I18nService, Lang } from './services/i18n.service';
import { StoreService } from './services/store.service';
import { NativeService } from './services/native.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonIcon, RouterLink, RouterLinkActive],
  template: `
    <ion-app>
      <div class="relative h-full w-full overflow-hidden bg-[#181818] text-[#d4d4d4]">
        <main class="absolute inset-x-0 top-0 bottom-[calc(58px+env(safe-area-inset-bottom))] overflow-hidden">
          <ion-router-outlet></ion-router-outlet>
        </main>
        <nav aria-label="Primary" class="absolute inset-x-0 bottom-0 z-50 h-[calc(58px+env(safe-area-inset-bottom))] border-t border-[#2b2b2b] bg-[#181818] pb-[env(safe-area-inset-bottom)]">
          <div class="mx-auto grid h-[58px] max-w-xl grid-cols-5">
            @for (item of nav; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="nav-active text-white"
                 [routerLinkActiveOptions]="{ exact: true }" #active="routerLinkActive"
                 class="relative flex min-w-0 flex-col items-center justify-center gap-0.5 border-t-2 border-transparent text-[#858585] transition-colors active:bg-[#2a2d2e]">
                <span class="flex h-7 w-10 items-center justify-center">
                  <ion-icon aria-hidden="true" [name]="item.icon" class="text-[20px]"></ion-icon>
                </span>
                <span class="text-[9px] font-medium uppercase leading-none tracking-[.06em]">{{ i18n.t(item.label) }}</span>
              </a>
            }
          </div>
        </nav>
      </div>
    </ion-app>
  `
})
export class AppComponent {
  i18n = inject(I18nService);
  private store = inject(StoreService);
  private native = inject(NativeService);

  readonly nav = [
    { path: '/dashboard', icon: 'cellular-outline', label: 'Signal' },
    { path: '/cells', icon: 'radio-outline', label: 'Cells' },
    { path: '/spectrum', icon: 'layers-outline', label: 'Bands' },
    { path: '/speed', icon: 'speedometer-outline', label: 'Speed' },
    { path: '/more', icon: 'grid-outline', label: 'More' }
  ];

  constructor() {
    addIcons({ cellularOutline, radioOutline, layersOutline, speedometerOutline, gridOutline });
    this.store.init().then(() => {
      const saved = this.store.settings.lang;
      this.i18n.setLang((saved as Lang) || this.i18n.autoDetect());
      this.native.devMode = this.store.settings.devMode;
      this.store.setDevMode(this.store.settings.devMode);
    });
  }
}
