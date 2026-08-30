import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { NativeService, Snapshot } from '../services/native.service';
import { StoreService } from '../services/store.service';
import { I18nService } from '../services/i18n.service';
import { CellRec } from '../models';
import { SignalBarsComponent } from '../components/signal-bars.component';

@Component({
  selector: 'cs-cells',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SignalBarsComponent,
    IonHeader, IonToolbar, IonTitle, IonContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('Cells') }} ({{ cells().length }})</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        @if (native.platform === 'ios') {
          <div class="cs-card" style="border-color: var(--cs-accent);">
            <h3>iOS</h3>
            <div class="cs-dim">{{ t('Apple restricts access to cell identifiers (PCI, TAC, CID) and neighbor cells. Technology, carrier and signal level are shown.') }}</div>
          </div>
        }
        @for (c of cells(); track c.timestamp + '' + c.pci + c.cid; let i = $index) {
          <div class="cs-card cell-card">
            <div class="head" (click)="toggle(i)">
              <span class="tech">{{ c.tech }}</span>
              <span class="band">{{ c.bandLabel || '?' }}</span>
              @if (c.registered) { <span class="cs-badge ok">{{ t('serving') }}</span> }
              <span style="flex:1"></span>
              <cs-signal-bars [dbm]="c.dbm ?? c.rsrp"></cs-signal-bars>
              <span class="chev">{{ open() === i ? '▾' : '▸' }}</span>
            </div>
            <div class="quick">
              {{ c.freqDlMhz ? (c.freqDlMhz >= 1000 ? (c.freqDlMhz / 1000).toFixed(3) + ' GHz' : c.freqDlMhz.toFixed(1) + ' MHz') : 'freq n/a' }}
              · ARFCN {{ c.arfcn ?? '?' }}
              @if (c.rsrp != null) { · RSRP {{ c.rsrp }} dBm }
            </div>
            @if (open() === i) {
              <div>
                <div class="cs-kv"><span class="k">Technology</span><span class="v">{{ techLong(c.tech) }}</span></div>
                <div class="cs-kv"><span class="k">Band</span><span class="v">{{ c.band != null ? (c.tech === 'NR' ? 'n' : 'B') + c.band : '—' }}@if (c.bands.length > 1) { ({{c.bands.join(', ')}}) }</span></div>
                <div class="cs-kv"><span class="k">DL frequency</span><span class="v">{{ fmt(c.freqDlMhz) }}</span></div>
                <div class="cs-kv"><span class="k">UL frequency</span><span class="v">{{ fmt(c.freqUlMhz) }}</span></div>
                <div class="cs-kv"><span class="k">Channel (ARFCN)</span><span class="v cs-mono">{{ c.arfcn ?? '—' }}</span></div>
                <div class="cs-kv"><span class="k">Bandwidth</span><span class="v">{{ c.bandwidthMhz != null ? c.bandwidthMhz + ' MHz' : '—' }}</span></div>
                <div class="cs-kv"><span class="k">PCI / CID</span><span class="v cs-mono">{{ c.pci ?? '—' }} / {{ c.cid ?? '—' }}</span></div>
                <div class="cs-kv"><span class="k">TAC / LAC</span><span class="v cs-mono">{{ c.tac ?? '—' }}</span></div>
                <div class="cs-kv"><span class="k">PLMN</span><span class="v cs-mono">@if (c.mcc) { {{ c.mcc }}-{{ c.mnc }} } @else {—}</span></div>
                <div class="cs-kv"><span class="k">RSRP / RSRQ</span><span class="v">{{ c.rsrp ?? '—' }} dBm / {{ c.rsrq ?? '—' }} dB</span></div>
                <div class="cs-kv"><span class="k">RSSI / SINR</span><span class="v">{{ c.rssi ?? '—' }} dBm / {{ c.sinr ?? '—' }} dB</span></div>
                @if (c.timingAdvance != null) { <div class="cs-kv"><span class="k">Timing advance</span><span class="v">{{ c.timingAdvance }}</span></div> }
              </div>
            }
          </div>
        } @empty {
          <div class="cs-empty">
            No cells reported yet.<br /><br />
            On Android 10+ a location permission (and location services ON) is required to read cell info.
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [
    `
      .cell-card .head { display:flex; align-items:center; gap:8px; cursor:pointer; }
      .cell-card .tech { font-weight:800; font-size:16px; min-width:52px; }
      .cell-card .band { font-weight:700; color: var(--ion-color-primary); }
      .cell-card .quick { font-size:12.5px; color:var(--ion-color-medium); margin-top:4px; }
      .chev { color: var(--ion-color-medium); margin-left:6px; }
    `
  ]
})
export class CellsPage implements OnInit, OnDestroy {
  snap = signal<Snapshot | null>(null);
  open = signal(-1);
  private timer?: number;

  t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);

  constructor(public native: NativeService, private store: StoreService, public i18n: I18nService) {}

  ngOnInit(): void {
    this.poll();
    this.timer = window.setInterval(() => {
      if (!document.hidden) this.poll();
    }, this.store.settings.pollMs);
  }
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    const s = await this.native.snapshot();
    const sorted = [...s.cells].sort((a, b) => Number(b.registered) - Number(a.registered));
    this.snap.set({ ...s, cells: sorted });
  }

  cells(): CellRec[] {
    return this.snap()?.cells || [];
  }

  toggle(i: number): void {
    this.open.set(this.open() === i ? -1 : i);
  }

  techLong(t: string): string {
    if (t === 'NR') {
      const mode = this.snap()?.service.nrMode;
      return mode ? `5G NR (${mode === 'SA' ? 'Standalone' : 'Non-Standalone'})` : '5G NR';
    }
    return (
      {
        LTE: '4G LTE',
        WCDMA: '3G UMTS/WCDMA',
        GSM: '2G GSM/GPRS/EDGE',
        CDMA: 'CDMA/EVDO',
        TDSCDMA: 'TD-SCDMA',
        IWLAN: 'IWLAN',
        UNKNOWN: 'Unknown'
      } as { [k: string]: string }
    )[t] || t;
  }

  fmt(f: number | null): string {
    if (f == null) return '—';
    return f >= 1000 ? `${(f / 1000).toFixed(3)} GHz` : `${f.toFixed(1)} MHz`;
  }
}
