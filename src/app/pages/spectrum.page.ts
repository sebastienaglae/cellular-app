import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList,
  IonMenuButton, IonButtons, IonSearchbar, IonTitle, IonToolbar, IonNote, IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { NativeService, Snapshot } from '../services/native.service';
import { StoreService } from '../services/store.service';
import { CountrySpectrum, SpectrumAlloc, spectrumForCountry } from '../data/spectrum';
import { LTE_BANDS, NR_RANGES, earfcnToFreqDl, fmtMhz, nrBandFreqRange, nrArfcnToFreqMhz, bandLabel } from '../data/bands';
import { MCC_COUNTRY } from '../data/plmn-db';

interface BandRowView {
  key: string;
  range: string;
}

@Component({
  selector: 'cs-spectrum',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
    IonSearchbar, IonList, IonItem, IonLabel, IonNote, IonInput, IonSelect, IonSelectOption
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>Bands &amp; Spectrum</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <div class="cs-card">
          <h3>Current cell frequency</h3>
          @if (serving(); as s) {
            <div class="cs-kv"><span class="k">Technology</span><span class="v">{{ s.tech }} {{ s.bandLabel }}</span></div>
            <div class="cs-kv"><span class="k">Downlink</span><span class="v">{{ fmtMhz(s.freqDlMhz) }}</span></div>
            <div class="cs-kv"><span class="k">Uplink</span><span class="v">{{ fmtMhz(s.freqUlMhz) }}</span></div>
            <div class="cs-kv"><span class="k">Channel</span><span class="v cs-mono">{{ s.arfcn }}</span></div>
            <div class="cs-kv"><span class="k">Carrier BW</span><span class="v">{{ s.bandwidthMhz != null ? s.bandwidthMhz + ' MHz' : '—' }}</span></div>
          } @else {
            <div class="cs-empty">No serving cell data</div>
          }
        </div>

        <div class="cs-card">
          <h3>Country spectrum allocation</h3>
          <div class="cs-dim" style="margin-bottom:8px;">
            Complete offline dataset from spectrum-tracker.com (94 countries),
            bundled with the app.
          </div>
          <ion-select
            [ngModel]="country()"
            (ngModelChange)="country.set($event)"
            interface="popover"
            label="Country"
            style="width:100%; margin-bottom:6px;"
          >
            <ion-select-option value="">(auto-detect)</ion-select-option>
            @for (c of countries; track c.iso) {
              <ion-select-option [value]="c.iso">{{ c.name }}</ion-select-option>
            }
          </ion-select>
          @if (activeSpectrum(); as cs) {
            <div class="cs-dim" style="margin-bottom:4px;">
              {{ cs.name }}
              @if (isAutoDetected()) { <span class="cs-badge ok" style="margin:0 6px;">auto-detected</span> }
              · {{ cs.allocs.length }} allocations
              · source: {{ cs.source || 'bundled sample' }}
              @if (cs.updated) {· {{ cs.updated }}}
            </div>
            <ion-searchbar placeholder="Filter operator or band…" debounce="150" [(ngModel)]="allocFilter"></ion-searchbar>
            @for (g of grouped(cs); track g.band) {
              <div class="band-head">
                <b>{{ g.band || '?' }}</b>
                @if (g.layer) { <span class="layer">{{ g.layer }} MHz</span> }
                @if (g.duplex) { <span class="cs-badge" [class.warn]="g.duplex === 'TDD'">{{ g.duplex }}</span> }
              </div>
              @for (a of g.rows; track $index) {
                <div class="spec-row">
                  <b>{{ a.op || a.ops.join(', ') }}</b>
                  <span class="freqs">
                    @if (a.dl && a.dl[0] != null) {
                      {{ fmtRange(a.dl[0], a.dl[1]) }} DL
                      @if (a.ul && a.ul[0] != null) { · UL {{ fmtRange(a.ul[0], a.ul[1]) }} }
                    } @else {
                      {{ a.ops.join(', ') }}
                    }
                    @if (a.total != null) { <span class="tot">{{ a.total }} MHz</span> }
                    @if (a.scope && a.scope !== 'Nationwide') { <span class="scope">{{ a.scope }}</span> }
                  </span>
                </div>
              }
            }
          } @else {
            <div class="cs-empty">
              No country detected. Set one above or connect to a network.
            </div>
          }
        </div>

        <div class="cs-card">
          <h3>Browse all bands</h3>
          <ion-searchbar placeholder="e.g. n78, B20, 3500" [(ngModel)]="query" debounce="150"></ion-searchbar>
          <div class="spec-table">
            <div class="spec-row head"><span>Band</span><span>Frequencies</span></div>
            @for (r of filteredBands(); track r.key) {
              <div class="spec-row"><b>{{ r.key }}</b><span>{{ r.range }}</span></div>
            }
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .spec-row { display:flex; justify-content:space-between; gap:10px; padding:7px 2px; font-size:13px;
                  border-bottom:1px dashed rgba(148,163,184,.18); }
      .spec-row.head { color:var(--ion-color-medium); text-transform:uppercase; font-size:11px; letter-spacing:.06em; }
      .band-head { display:flex; align-items:center; gap:8px; margin-top:12px; padding-bottom:4px;
                   border-bottom:1px solid rgba(148,163,184,.3); }
      .band-head b { font-size:15px; color: var(--cs-info, #4d8dff); }
      .band-head .layer { font-size:11.5px; color: var(--ion-color-medium); }
      .freqs { text-align:right; font-size:12.5px; color:#cfd6e4; font-variant-numeric:tabular-nums; }
      .tot { color: var(--ion-color-medium); margin-left:6px; }
      .scope { display:inline-block; margin-left:6px; font-size:10.5px; padding:1px 7px; border-radius:999px;
               background: rgba(255,196,9,.14); color:#ffd75e; }
      .hot b { color: var(--cs-ok); }
      ion-searchbar { padding-left:0; padding-right:0; --background: rgba(148,163,184,.12); min-height:34px; }
    `
  ]
})
export class SpectrumPage implements OnInit, OnDestroy {
  snap = signal<Snapshot | null>(null);
  country = signal('');
  query = '';
  allocFilter = '';
  private timer?: number;

  constructor(private native: NativeService, private store: StoreService) {}

  readonly countries = Object.entries(MCC_COUNTRY)
    .map(([, v]) => ({ iso: v[1], name: v[0] }))
    .filter((c, i, arr) => arr.findIndex(x => x.iso === c.iso) === i)
    .sort((a, b) => a.name.localeCompare(b.name));

  ngOnInit(): void {
    this.poll();
    this.timer = window.setInterval(() => this.poll(), 4000);
  }
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
  private async poll(): Promise<void> {
    if (!document.hidden) this.snap.set(await this.native.snapshot());
  }

  serving() {
    return this.snap()?.cells.find(c => c.registered) || null;
  }

  activeSpectrum(): CountrySpectrum | null {
    const iso =
      this.country() ||
      this.store.settings.countryOverride ||
      (this.snap()?.service.isoCountry || '').toUpperCase();
    return spectrumForCountry(this.store.allSpectrum(), iso);
  }

  isAutoDetected(): boolean {
    return !this.country() && !this.store.settings.countryOverride && !!this.snap()?.service.isoCountry;
  }

  grouped(cs: CountrySpectrum): { band: string; layer?: string | null; duplex?: string | null; rows: SpectrumAlloc[] }[] {
    const q = this.allocFilter.trim().toLowerCase();
    const map = new Map<string, { band: string; layer?: string | null; duplex?: string | null; rows: SpectrumAlloc[] }>();
    for (const a of cs.allocs) {
      if (q && !`${a.op || ''} ${a.band} ${a.ops?.join(' ') || ''}`.toLowerCase().includes(q)) continue;
      const key = a.band || (a.ops ? a.ops.join(',') : '—');
      if (!map.has(key)) {
        map.set(key, { band: key, layer: a.layer, duplex: a.duplex, rows: [] });
      }
      map.get(key)!.rows.push(a);
    }
    for (const g of map.values()) {
      g.rows.sort((x, y) => (x.dl?.[0] ?? x.total ?? 0) - (y.dl?.[0] ?? y.total ?? 0));
    }
    return [...map.values()];
  }

  fmtRange(lo: number | null, hi: number | null): string {
    if (lo == null) return '—';
    return hi != null && hi !== lo ? `${lo}–${hi}` : `${lo}`;
  }

  isHot(a: { band: string }): boolean {
    const srv = this.serving();
    if (!srv) return false;
    return a.band.toLowerCase() === srv.bandLabel.toLowerCase();
  }

  filteredBands(): BandRowView[] {
    const q = this.query.trim().toLowerCase();
    const qNum = parseFloat(q);
    const lte: BandRowView[] = LTE_BANDS.map(b => ({
      key: bandLabel('LTE', b.band),
      range: `${fmtMhz(b.dlLow)} – ${fmtMhz(b.dlLow + (b.eMax - b.eMin) * 0.1)}`
    }));
    const nr: BandRowView[] = NR_RANGES.filter(r => !r.fr2).map(r => {
      const fr = nrBandFreqRange(r.band)!;
      return { key: `n${r.band}`, range: `${fmtMhz(fr.lo)} – ${fmtMhz(fr.hi)}` };
    });
    const nr2: BandRowView[] = NR_RANGES.filter(r => r.fr2).map(r => {
      const fr = nrBandFreqRange(r.band)!;
      return { key: `n${r.band}`, range: `${fmtMhz(fr.lo)} – ${fmtMhz(fr.hi)}` };
    });
    const all = [...lte, ...nr, ...nr2];
    if (!q) return all.slice(0, 40);
    return all.filter(
      b =>
        b.key.toLowerCase().includes(q.replace(/^band/i, 'b')) ||
        (!!qNum && b.range.includes(String(qNum)))
    ).slice(0, 60);
  }

  protected readonly fmtMhz = fmtMhz;
}
