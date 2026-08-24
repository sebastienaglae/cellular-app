import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard.page').then(m => m.DashboardPage) },
  { path: 'cells', loadComponent: () => import('./pages/cells.page').then(m => m.CellsPage) },
  { path: 'spectrum', loadComponent: () => import('./pages/spectrum.page').then(m => m.SpectrumPage) },
  { path: 'operators', loadComponent: () => import('./pages/operators.page').then(m => m.OperatorsPage) },
  { path: 'speed', loadComponent: () => import('./pages/speed.page').then(m => m.SpeedPage) },
  { path: 'ping', loadComponent: () => import('./pages/ping.page').then(m => m.PingPage) },
  { path: 'ipinfo', loadComponent: () => import('./pages/ipinfo.page').then(m => m.IpInfoPage) },
  { path: 'ookla', loadComponent: () => import('./pages/ookla.page').then(m => m.OoklaPage) },
  { path: 'history', loadComponent: () => import('./pages/history.page').then(m => m.HistoryPage) },
  { path: 'heatmap', loadComponent: () => import('./pages/heatmap.page').then(m => m.HeatmapPage) },
  { path: 'settings', loadComponent: () => import('./pages/settings.page').then(m => m.SettingsPage) },
  { path: 'more', loadComponent: () => import('./pages/more.page').then(m => m.MorePage) },
  { path: '**', redirectTo: 'dashboard' }
];
