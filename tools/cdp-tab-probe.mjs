/** Navigate to a tab via synthetic touch, then probe touch-scrolling on that page. */
import { get } from 'node:http';

const TAB = process.argv[2] ?? 'settings'; // settings | cells | dashboard
const targets = await new Promise((res, rej) => {
  get('http://127.0.0.1:9222/json', r => {
    let d = '';
    r.on('data', c => (d += c));
    r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
const page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0;
const pending = new Map();
const send = (m, p) => new Promise(res => {
  const i = ++id;
  pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method: m, params: p }));
});
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
const evl = async e =>
  (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
const touch = async (type, x, y) =>
  send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });

// viewport is 461 x 1024 CSS px; 5 tabs across the bar at y≈980
const idx = { dashboard: 0, cells: 1, spectrum: 2, speed: 3, more: 4 }[TAB] ?? 0;
const tx = 46 + idx * 92;
await touch('touchStart', tx, 980);
await touch('touchEnd', tx, 980);
await new Promise(r => setTimeout(r, 1200));

console.log('page:', await evl(`document.querySelector('ion-router-outlet .ion-page')?.tagName + ' / ' + location.hash`));

// spy + swipe upward in the middle of THIS page
await evl(`window.__tm = []; document.addEventListener('touchmove', e => window.__tm.push([e.target.tagName, e.defaultPrevented]), { capture: true, passive: false }); 'on'`);
await touch('touchStart', 230, 700);
for (let y = 700; y >= 350; y -= 70) {
  await touch('touchMove', 230, y);
  await new Promise(r => setTimeout(r, 25));
}
await touch('touchEnd', 230, 350);
await new Promise(r => setTimeout(r, 400));

console.log('spy:', await evl('JSON.stringify(window.__tm.slice(0,6))'));
console.log('scroll:', await evl(`(() => {
  const c = document.querySelector('ion-content');
  const i = c.shadowRoot.querySelector('.inner-scroll');
  return JSON.stringify({ top: i.scrollTop, sh: i.scrollHeight, ch: i.clientHeight });
})()`));
process.exit(0);
