import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge, IonContent, IonHeader, IonIcon, IonSearchbar, IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { idCardOutline } from 'ionicons/icons';
import { NativeService, Snapshot } from '../services/native.service';
import { lookupPlmn, OperatorInfo, searchPlmn } from '../data/plmn-db';
import { FlagComponent } from '../components/flag.component';

@Component({
  selector: 'cs-operators',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonBadge, IonSearchbar, IonIcon, FlagComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Operators &amp; MVNO</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="cs-page">
        <div class="cs-card">
          <h3><ion-icon name="id-card-outline"></ion-icon> SIM / subscriptions</h3>
          @if (snap(); as s) {
            @if (s.sims.length) {
              @for (sim of s.sims; track sim.subscriptionId) {
                <div class="sim-card">
                  <div class="cs-kv">
                    <span class="k">Carrier</span>
                    <span class="v carrier">
                      @if (sim.isoCountry) { <cs-flag [iso]="sim.isoCountry" [size]="18"></cs-flag> }
                      {{ sim.carrierName || '—' }}
                    </span>
                  </div>
                  <div class="cs-kv"><span class="k">Display name</span><span class="v">{{ sim.displayName || '—' }}</span></div>
                  <div class="cs-kv"><span class="k">PLMN (ICCID)</span><span class="v cs-mono">{{ sim.mcc }}-{{ sim.mnc }}</span></div>
                  <div class="cs-kv"><span class="k">Slot / eSIM</span><span class="v">#{{ sim.slotIndex }} · {{ sim.isEmbedded ? 'eSIM' : 'physical' }}</span></div>
                </div>
              }
            } @else {
              <div class="cs-empty">No subscription info (needs phone permission)</div>
            }
          } @else {
            <div class="cs-empty">Loading…</div>
          }
        </div>

        <div class="cs-card">
          <h3>Network registration</h3>
          @if (netOp(); as op) {
            <div class="op-line">
              @if (netOp()?.iso) { <cs-flag [iso]="netOp()!.iso" [size]="26"></cs-flag> }
              <b>{{ snap()!.service.operatorName || 'Unknown' }}</b>
              @if (isMvno()) { <ion-badge color="tertiary">MVNO on {{ mvnoHost() }}</ion-badge> }
              @if (snap()!.service.roaming) { <ion-badge color="warning">roaming</ion-badge> }
            </div>
            <div class="cs-kv"><span class="k">Network PLMN</span><span class="v cs-mono">{{ op.plmn }}</span></div>
            <div class="cs-kv"><span class="k">Resolved name</span><span class="v">{{ op.name }}</span></div>
            @if (op.country) { <div class="cs-kv"><span class="k">Country</span><span class="v">{{ op.country }}</span></div> }
            <div class="mvno-note" [class.show]="!!mvnoHint()">
              {{ mvnoHint() }}
            </div>
          } @else {
            <div class="cs-empty">Not registered to a network</div>
          }
        </div>

        <div class="cs-card">
          <h3>Neighbor cells</h3>
          @if (neighbors().length) {
            @for (c of neighbors(); track $index) {
              <div class="spec-row">
                <b>{{ c.bandLabel || c.tech }}</b>
                <span>{{ c.freqDlMhz ? fmtF(c.freqDlMhz) : c.arfcn || '?' }} · PCI {{ c.pci ?? '?' }}</span>
              </div>
            }
          } @else {
            <div class="cs-empty">No neighbor cells reported by modem right now</div>
          }
        </div>

        <div class="cs-card">
          <h3>PLMN database lookup</h3>
          <ion-searchbar placeholder="Operator or MCC-MNC…" debounce="200" [(ngModel)]="q" (ngModelChange)="doSearch()"></ion-searchbar>
          @for (r of results(); track r.plmn + r.name) {
            <div class="spec-row">
              <b>{{ r.name }}</b>
              <span>{{ r.plmn }}@if (r.mvnoHost) { · MVNO → {{ r.mvnoHost }} }@if (r.country) { · {{ r.country }}}</span>
            </div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .sim-card { border-left:3px solid var(--ion-color-primary); padding-left:10px; margin-bottom:8px; }
      .op-line { display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:8px; font-size:16px; }
      .carrier { display:inline-flex; align-items:center; gap:7px; }
      .mvno-note { font-size:12px; color:var(--ion-color-medium); margin-top:6px; opacity:0; transition:.3s; }
      .mvno-note.show { opacity:1; }
      .spec-row { display:flex; justify-content:space-between; gap:10px; padding:7px 2px; font-size:13px;
                  border-bottom:1px dashed var(--cs-border); }
      ion-searchbar { padding-left:0; padding-right:0; --background: var(--cs-accent-soft); }
    `
  ]
})
export class OperatorsPage implements OnInit, OnDestroy {
  snap = signal<Snapshot | null>(null);
  q = '';
  results = signal<OperatorInfo[]>([]);
  private timer?: number;

  constructor(private native: NativeService) {
    addIcons({ idCardOutline });
  }

  ngOnInit(): void {
    this.poll();
    this.timer = window.setInterval(() => this.poll(), 5000);
  }
  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    this.snap.set(await this.native.snapshot());
  }

  netOp(): OperatorInfo | null {
    const n = this.snap()?.service.operatorNumeric;
    if (!n || n.length < 5) return null;
    return lookupPlmn(n.slice(0, 3), n.slice(3));
  }

  isMvno(): boolean {
    const op = this.netOp();
    if (!op) return false;
    const spn = (this.snap()?.sims[0]?.displayName || this.snap()?.service.operatorName || '').toLowerCase();
    return !!op.mvnoHost || (!!spn && op.name && !op.name.toLowerCase().includes(spn) && spn.length > 2);
  }

  mvnoHost(): string | null {
    const op = this.netOp();
    return op?.mvnoHost || null;
  }

  mvnoHint(): string | null {
    if (!this.isMvno()) return null;
    const brand = this.snap()?.sims[0]?.displayName || this.snap()?.service.operatorName;
    return `Brand "${brand}" appears to be an MVNO riding on ${this.mvnoHost() || 'a host network'} (detected via SPN/PLMN mismatch).`;
  }

  neighbors() {
    return (this.snap()?.cells || []).filter(c => !c.registered).slice(0, 20);
  }

  doSearch(): void {
    this.results.set(searchPlmn(this.q));
  }

  fmtF(f: number): string {
    return f >= 1000 ? `${(f / 1000).toFixed(2)} GHz` : `${f.toFixed(0)} MHz`;
  }
}
