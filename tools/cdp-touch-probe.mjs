/** CDP touch-scroll probe: spies on touchmove cancellation and tries a raw touch swipe. */
import { get } from 'node:http';

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
const send = (method, params) => new Promise(res => {
  const i = ++id;
  pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
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

console.log('spy:', await evl(`
  window.__tm = [];
  document.addEventListener('touchmove', e => window.__tm.push([e.target.tagName, e.defaultPrevented, !!(e.cancelable)]), { capture: true, passive: false });
  'on'
`));

const touch = async (type, x, y) =>
  send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }]
  });

await touch('touchStart', 205, 700);
for (let y = 1400; y >= 350; y -= 70) {
  await touch('touchMove', 205, y);
  await new Promise(r => setTimeout(r, 25));
}
await touch('touchEnd', 205, 350);
await new Promise(r => setTimeout(r, 400));

console.log('touchmove events:', await evl('JSON.stringify(window.__tm.slice(0,10))'));
console.log('scroll state:', await evl(`(() => {
  const c = document.querySelector('ion-content');
  const i = c.shadowRoot.querySelector('.inner-scroll');
  return JSON.stringify({ top: i.scrollTop, sh: i.scrollHeight, ch: i.clientHeight });
})()`));
process.exit(0);
