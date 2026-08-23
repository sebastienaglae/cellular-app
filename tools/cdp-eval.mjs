/** Evaluate JS in the app's WebView via Chrome DevTools Protocol.
 * Usage: node tools/cdp-eval.mjs "<expression>"
 */
import { get } from 'node:http';

const expr = process.argv[2] ?? 'document.title';

const targets = await new Promise((resolve, reject) => {
  get('http://127.0.0.1:9222/json', res => {
    let d = '';
    res.on('data', c => (d += c));
    res.on('end', () => resolve(JSON.parse(d)));
  }).on('error', reject);
});

const page = targets.find(t => t.type === 'page') ?? targets[0];
if (!page?.webSocketDebuggerUrl) {
  console.error('no CDP target', targets);
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
const result = await new Promise((resolve, reject) => {
  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: { expression: expr, returnByValue: true, awaitPromise: true }
    }));
  };
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id === 1) resolve(msg.result);
  };
  ws.onerror = e => reject(new Error('ws error'));
  setTimeout(() => reject(new Error('timeout')), 8000);
});
ws.close();
console.log(JSON.stringify(result, null, 1));
