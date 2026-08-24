/** One-off: i18n wiring for speed + history pages (structured movement + t helper). */
const fs = require('fs');

// ---------- speed.page ----------
let s = fs.readFileSync('src/app/pages/speed.page.ts', 'utf8');
if (!s.includes("I18nService")) {
  s = s.replace(
    "import { FlagComponent } from '../components/flag.component';",
    "import { FlagComponent } from '../components/flag.component';\nimport { I18nService } from '../services/i18n.service';"
  );
}
s = s.replace(
  /  movedText\(l: SpeedResult\): string \| null \{[\s\S]*?\n  \}/,
  `  movedText(l: SpeedResult): string | null {
    const tests = this.store.tests$.value;
    const idx = tests.findIndex(x => x.id === l.id);
    if (idx <= 0) return this.t('geo.start');
    const prev = tests[idx - 1];
    const mv = movementText(prev.geo, l.geo);
    if (!mv.kind) return null;
    if (mv.kind === 'same') return this.t('geo.same');
    if (mv.kind === 'm') return this.t('geo.m', { n: mv.n });
    return this.t('geo.km', { n: mv.n });
  }`
);
if (!s.includes('public i18n: I18nService')) {
  s = s.replace('    private toast: ToastController,', '    private toast: ToastController,\n    public i18n: I18nService,');
}
if (!s.includes('  t = (k: string')) {
  s = s.replace('  constructor(', '  t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);\n\n  constructor(');
}
// translate phase labels + toasts
s = s.replace("this.phase.set(ph);", "this.phase.set(ph === 'DOWNLOAD' ? this.t('DOWN') : this.t('UP'));");
s = s.replace("this.phase.set(phase.toUpperCase());", "this.phase.set(phase === 'latency' ? this.t('Latency') : phase === 'download' ? this.t('DOWN') : phase === 'upload' ? this.t('UP') : this.t('Saved'));");
s = s.replace("this.toastMsg(`Saved ${res.dlMbps?.toFixed(1)} Mbps down`);", "this.toastMsg(`${this.t('Saved')} — ${res.dlMbps?.toFixed(1)} Mbps`);");
s = s.replace("this.toastMsg('Test failed — check connectivity and endpoint URL');", "this.toastMsg(this.t('Test failed — check connectivity and endpoint URL'));");
s = s.replace("this.toastMsg(`Continuous testing every ${this.store.settings.constantTestMin} min`);", "this.toastMsg(this.t('every {n} min, geo-tagged, saved on device', { n: this.store.settings.constantTestMin }));");
fs.writeFileSync('src/app/pages/speed.page.ts', s);
console.log('speed ok:', s.includes('geo.start'), s.includes('public i18n'));

// ---------- history.page ----------
let h = fs.readFileSync('src/app/pages/history.page.ts', 'utf8');
h = h.replace(
  "import { colorForMbps } from '../utils/view';",
  "import { colorForMbps } from '../utils/view';\nimport { I18nService } from '../services/i18n.service';"
);
h = h.replace(
  /  movedText\(t: SpeedResult\): string \| null \{[\s\S]*?\n  \}/,
  `  movedText(t: SpeedResult): string | null {
    const tests = this.store.tests$.value;
    const idx = tests.findIndex(x => x.id === t.id);
    if (idx <= 0) return this.t('geo.start');
    const prev = tests[idx - 1];
    const mv = movementText(prev.geo, t.geo);
    if (!mv.kind) return null;
    if (mv.kind === 'same') return this.t('geo.same');
    if (mv.kind === 'm') return this.t('geo.m', { n: mv.n });
    return this.t('geo.km', { n: mv.n });
  }`
);
if (!h.includes('public i18n: I18nService')) {
  h = h.replace('    private toast: ToastController,', '    private toast: ToastController,\n    public i18n: I18nService,');
}
if (!h.includes('  t = (k: string')) {
  h = h.replace('  constructor(', '  t = (k: string, p?: Record<string, string | number>) => this.i18n.t(k, p);\n\n  constructor(');
}
// translate static labels
h = h.replace("<ion-title>History</ion-title>", "<ion-title>{{ t('History') }}</ion-title>");
h = h.replace("<ion-segment-button value=\"list\"><ion-label>Tests</ion-label></ion-segment-button>", "<ion-segment-button value=\"list\"><ion-label>{{ t('Tests') }}</ion-label></ion-segment-button>");
h = h.replace("<ion-segment-button value=\"map\"><ion-label>Map</ion-label></ion-segment-button>", "<ion-segment-button value=\"map\"><ion-label>{{ t('Map') }}</ion-label></ion-segment-button>");
h = h.replace("<div class=\"cs-dim\" style=\"text-align:center; margin-top:8px;\">\n            {{ markers().length }} locations · offline OSM basemap · pinch to zoom\n          </div>",
  "<div class=\"cs-dim\" style=\"text-align:center; margin-top:8px;\">\n            {{ markers().length }} · {{ t('locations · offline OSM basemap · pinch to zoom') }}\n          </div>");
h = h.replace("<div class=\"cs-empty\">No geo-tagged tests yet</div>", "<div class=\"cs-empty\">{{ t('No geo-tagged tests yet') }}</div>");
h = h.replace("<div class=\"cs-empty\">Run a speed test to start building history</div>", "<div class=\"cs-empty\">{{ t('Run a speed test to start building history') }}</div>");
h = h.replace("<span class=\"mbps\">Mbps</span>", "<span class=\"mbps\">Mbps</span>");
h = h.replace("<div class=\"test-meta\">{{ t.latencyMs.toFixed(0) }} ms latency</div>", "<div class=\"test-meta\">{{ t.latencyMs.toFixed(0) }} ms {{ t2latency() }}</div>");
h = h.replace("<div class=\"test-meta\">{{ t.latencyMs.toFixed(0) }} ms latency</div>", "<div class=\"test-meta\">{{ t.latencyMs.toFixed(0) }} ms {{ t('latency') }}</div>");
h = h.replace("const t = await this.toast.create({ message: 'History cleared', duration: 1800, position: 'bottom' });", "const tt = await this.toast.create({ message: this.t('History cleared'), duration: 1800, position: 'bottom' });\n    await tt.present();");
h = h.replace("    const tt = await this.toast.create({ message: this.t('History cleared'), duration: 1800, position: 'bottom' });\n    await tt.present();\n    await t.present();", "    const tt = await this.toast.create({ message: this.t('History cleared'), duration: 1800, position: 'bottom' });\n    await tt.present();");
fs.writeFileSync('src/app/pages/history.page.ts', h);
console.log('history ok:', h.includes('geo.start'), h.includes('public i18n'));
