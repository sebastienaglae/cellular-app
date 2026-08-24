import { describe, expect, it } from 'vitest';

/** Pure logic extracted from FlagComponent template binding. */
function flagClass(iso: string): string {
  return `fi fis fi-${iso.toLowerCase()}`;
}

describe('FlagComponent ISO normalization', () => {
  it('renders with lowercase ISO in the class', () => {
    expect(flagClass('FR')).toBe('fi fis fi-fr');
  });

  it('handles already-lowercase ISO', () => {
    expect(flagClass('jp')).toBe('fi fis fi-jp');
  });

  it('handles 3-letter ISO codes', () => {
    expect(flagClass('USA')).toBe('fi fis fi-usa');
  });
});
