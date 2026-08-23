import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CELLSCOPE_DEV === '1';

const config: CapacitorConfig = {
  appId: 'com.cellscope.app',
  appName: 'CellScope',
  webDir: 'dist/cellscope/browser',
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: isDev,
    captureInput: true
  },
  server: {
    androidScheme: 'https',
    cleartext: isDev
  }
};

export default config;
