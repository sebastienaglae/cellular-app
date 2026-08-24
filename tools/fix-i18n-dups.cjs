/** Loop: build -> delete the duplicate i18n key line TS reports -> repeat. */
const { execSync } = require('child_process');
const fs = require('fs');

const F = 'src/app/services/i18n.service.ts';

for (let i = 0; i < 40; i++) {
  let out = '';
  try {
    out = execSync('npm run build', { encoding: 'utf8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const clean = out.replace(/\x1b\[[0-9;]*m/g, '');
  if (/Output location/.test(clean)) {
    console.log('BUILD OK after', i, 'fixes');
    break;
  }
  const m = clean.match(/i18n\.service\.ts:(\d+):\d+:\s*\n?\s*TS1117[^\n]*\n[^\n]*\n\s*(\d+ \u2502.*)/);
  // simpler: find "i18n.service.ts:LINE:" near a TS1117
  const errIdx = clean.indexOf('TS1117');
  if (errIdx < 0) {
    console.log('No TS1117 found and no build OK — first error block:');
    const ei = clean.indexOf('X [ERROR]');
    console.log(clean.substr(ei, 500));
    process.exit(1);
  }
  const lineMatch = clean.slice(errIdx).match(/i18n\.service\.ts:(\d+):\d+/);
  if (!lineMatch) {
    console.log('cannot locate line for TS1117');
    process.exit(1);
  }
  const lineNo = parseInt(lineMatch[1], 10) - 1; // 0-based
  const lines = fs.readFileSync(F, 'utf8').split('\n');
  const dropped = lines.splice(lineNo, 1);
  fs.writeFileSync(F, lines.join('\n'));
  console.log('dropped line', lineNo + 1, ':', dropped[0].trim().slice(0, 80));
}
