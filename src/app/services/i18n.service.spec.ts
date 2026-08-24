import { describe, expect, it } from 'vitest';
import { I18nService, Lang } from './i18n.service';

describe('I18nService', () => {
  let svc: I18nService;

  it('defaults to English', () => {
    svc = new I18nService();
    expect(svc.lang()).toBe('en');
    expect(svc.t('Signal')).toBe('Signal');
  });

  it('translates to French', () => {
    svc = new I18nService();
    svc.setLang('fr');
    expect(svc.lang()).toBe('fr');
    expect(svc.t('Signal')).toBe('Signal'); // same in FR
    expect(svc.t('Cells')).toBe('Cellules');
    expect(svc.t('Country')).toBe('Pays');
  });

  it('translates to Japanese', () => {
    svc = new I18nService();
    svc.setLang('jp');
    expect(svc.t('Cells')).toBe('セル');
    expect(svc.t('Position')).toBe('位置');
  });

  it('translates to Spanish', () => {
    svc = new I18nService();
    svc.setLang('es');
    expect(svc.t('Cells')).toBe('Celdas');
    expect(svc.t('Country')).toBe('País');
  });

  it('translates to German', () => {
    svc = new I18nService();
    svc.setLang('de');
    expect(svc.t('Cells')).toBe('Zellen');
    expect(svc.t('Country')).toBe('Land');
  });

  it('translates to Chinese', () => {
    svc = new I18nService();
    svc.setLang('zh');
    expect(svc.t('Cells')).toBe('小区');
    expect(svc.t('Country')).toBe('国家');
  });

  it('falls back to English for unknown keys', () => {
    svc = new I18nService();
    svc.setLang('fr');
    expect(svc.t('__nonexistent_key__')).toBe('__nonexistent_key__');
  });

  it('supports {n} interpolation', () => {
    svc = new I18nService();
    svc.setLang('fr');
    const result = svc.t('every {n} min, geo-tagged, saved on device', { n: 30 });
    expect(result).toContain('30');
    expect(result).not.toContain('{n}');
  });

  it('switching languages updates subsequent lookups', () => {
    svc = new I18nService();
    svc.setLang('fr');
    expect(svc.t('More')).toBe('Plus');
    svc.setLang('de');
    expect(svc.t('More')).toBe('Mehr');
    svc.setLang('en');
    expect(svc.t('More')).toBe('More');
  });
});
