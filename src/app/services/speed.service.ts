import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { SpeedResult } from '../models';
import { NativeService } from './native.service';
import { StoreService } from './store.service';

/**
 * HTTP-based speed test + continuous monitor.
 * Uses configurable endpoints (default Cloudflare). Needs internet for tests -
 * every other feature of the app is fully offline.
 */

const CHUNK = 1 << 16; // 64 KiB

@Injectable({ providedIn: 'root' })
export class SpeedService {
  private running = false;
  private cancelFlag = false;

  constructor(private native: NativeService, private store: StoreService) {}

  static fakeCurve(seconds: number, peakMbps: number): number {
    // plausible ramp used in dev mode
    const t = seconds / 2.5;
    return peakMbps * (1 - Math.exp(-t));
  }

  async ensureGeoPermission(): Promise<boolean> {
    try {
      const st = await Geolocation.checkPermissions();
      if (st.location === 'granted' || st.coarseLocation === 'granted') return true;
      const req = await Geolocation.requestPermissions();
      return req.location === 'granted' || req.coarseLocation === 'granted';
    } catch {
      return false;
    }
  }

  private async geo(): Promise<SpeedResult['geo']> {
    if (!this.store.settings.saveGeoWithTests) return null;
    try {
      const pos = await Geolocation.getCurrentPosition({ timeout: 8000, enableHighAccuracy: true });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude, acc: pos.coords.accuracy };
    } catch {
      return null;
    }
  }

  async measureLatency(url: string): Promise<{ latencyMs: number | null; jitterMs: number | null }> {
    try {
      const origin = new URL(url).origin;
      const times: number[] = [];
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        await fetch(`${origin}/__down?bytes=0`, { cache: 'no-store', mode: 'cors' }).catch(() =>
          fetch(origin, { cache: 'no-store', method: 'HEAD' })
        );
        times.push(performance.now() - t0);
      }
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const jit = Math.sqrt(times.reduce((a, t) => a + (t - avg) ** 2, 0) / times.length);
      return { latencyMs: Math.min(...times), jitterMs: jit };
    } catch {
      return { latencyMs: null, jitterMs: null };
    }
  }

  async measureDownload(url: string, ms: number, onProgress?: (mbps: number) => void): Promise<number | null> {
    this.cancelFlag = false;
    try {
      const started = performance.now();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.body) {
        const blob = await res.blob();
        const secs = (performance.now() - started) / 1000;
        return (blob.size * 8) / secs / 1e6;
      }
      const reader = res.body.getReader();
      let bytes = 0;
      let lastT = performance.now();
      let lastB = 0;
      while (true) {
        const now = performance.now();
        if (now - started > ms || this.cancelFlag) break;
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (onProgress && now - lastT > 250) {
          onProgress(((bytes - lastB) * 8) / ((now - lastT) / 1000) / 1e6);
          lastT = now;
          lastB = bytes;
        }
      }
      const secs = (performance.now() - started) / 1000;
      return (bytes * 8) / secs / 1e6;
    } catch {
      return null;
    }
  }

  async measureUpload(url: string, ms: number, onProgress?: (mbps: number) => void): Promise<number | null> {
    try {
      const started = performance.now();
      let sent = 0;
      let lastT = started;
      const payload = new Uint8Array(CHUNK);
      crypto.getRandomValues(payload.subarray(0, CHUNK));
      while (performance.now() - started < ms && !this.cancelFlag) {
        await fetch(url, { method: 'POST', body: payload, cache: 'no-store' });
        sent += CHUNK;
        if (onProgress) {
          const now = performance.now();
          if (now - lastT > 250) {
            onProgress((sent * 8) / ((now - started) / 1000) / 1e6);
            lastT = now;
          }
        }
      }
      const secs = (performance.now() - started) / 1000;
      return (sent * 8) / secs / 1e6;
    } catch {
      return null;
    }
  }

  cancel(): void {
    this.cancelFlag = true;
    this.running = false;
  }

  get busy(): boolean {
    return this.running;
  }

  /** Full test: latency -> download -> upload -> persist with location & network context. */
  async runFull(opts?: {
    quick?: boolean;
    onProgress?: (phase: 'latency' | 'download' | 'upload' | 'saving', mbps: number) => void;
  }): Promise<SpeedResult | null> {
    if (this.running) return null;
    this.running = true;
    this.cancelFlag = false;
    const s = this.store.settings;
    const emit = opts?.onProgress || (() => {});
    try {
      emit('latency', 0);
      const lat = opts?.quick ? { latencyMs: null, jitterMs: null } : await this.measureLatency(s.dlUrl);
      emit('download', 0);
      const dl = await this.measureDownload(s.dlUrl, opts?.quick ? 5000 : 12000, m => emit('download', m));
      emit('upload', 0);
      const ul = opts?.quick ? null : await this.measureUpload(s.ulUrl, 8000, m => emit('upload', m));
      emit('saving', dl || 0);
      const snap = await this.native.snapshot().catch(() => null);
      const result: SpeedResult = {
        id: `t${Date.now()}`,
        t: Date.now(),
        dlMbps: dl,
        ulMbps: ul,
        latencyMs: lat.latencyMs,
        jitterMs: lat.jitterMs,
        serverUrl: s.dlUrl.slice(0, 80),
        geo: await this.geo(),
        tech: snap ? `${snap.service.dataTech}${snap.service.nrMode ? '-' + snap.service.nrMode : ''}` : null,
        operator: snap?.service.operatorName || null,
        fake: this.native.devMode
      };
      await this.store.addTest(result);
      return result;
    } finally {
      this.running = false;
    }
  }
}
