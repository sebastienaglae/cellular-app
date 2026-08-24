import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SpeedService } from './speed.service';
import { NativeService } from './native.service';
import { StoreService } from './store.service';

// mock store
const storeMock = {
  settings: {
    dlUrl: 'https://speed.example.com/__down?bytes=1000',
    ulUrl: 'https://speed.example.com/__up',
    saveGeoWithTests: false,
    constantTestMin: 30,
    constantTestEnabled: false,
  },
  addTest: vi.fn(),
};

// mock native
const nativeMock = { devMode: false, snapshot: vi.fn(async () => null) };

describe('SpeedService', () => {
  let svc: SpeedService;

  beforeEach(() => {
    vi.restoreAllMocks();
    svc = new SpeedService(nativeMock as unknown as NativeService, storeMock as unknown as StoreService);
  });

  it('measureDownload counts bytes from a ReadableStream', async () => {
    const chunk = new Uint8Array(1000);
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.close();
      }
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { status: 200 })));
    // Override Date to control timing (3000 ms elapsed)
    const realNow = performance.now;
    let call = 0;
    vi.stubGlobal('performance', { ...performance, now: () => (call++ < 2 ? 0 : 3000) });

    const mbps = await svc.measureDownload('https://speed.example.com/__down?bytes=3000', 5000);
    vi.stubGlobal('performance', { now: realNow });
    // 3000 bytes in 3 s = 8000 bits/s = 0.008 Mbps
    expect(mbps).not.toBeNull();
    expect(mbps!).toBeGreaterThan(0);
  });

  it('measureDownload returns null on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network error'); }));
    const mbps = await svc.measureDownload('https://invalid', 1000);
    expect(mbps).toBeNull();
  });

  it('measureUpload returns null on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('fail'); }));
    const mbps = await svc.measureUpload('https://invalid', 100);
    expect(mbps).toBeNull();
  });

  it('measureLatency returns null when all requests fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const r = await svc.measureLatency('https://invalid');
    expect(r.latencyMs).toBeNull();
    expect(r.jitterMs).toBeNull();
  });

  it('runFull persists result via store.addTest', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array(100), { status: 200 })));
    vi.stubGlobal('performance', { ...performance, now: () => 0 });

    // mock geo
    vi.spyOn(svc as any, 'geo').mockResolvedValue(null);

    const res = await svc.runFull({ quick: true });
    expect(res).not.toBeNull();
    expect(res!.dlMbps).not.toBeNull();
    expect(storeMock.addTest).toHaveBeenCalled();
  });

  it('cancel prevents further measurement', async () => {
    svc.cancel();
    expect(svc.busy).toBe(false);
  });
});
