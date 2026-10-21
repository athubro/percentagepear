/**
 * Color theme definitions for PercentagePear.
 *
 * This module is intentionally DOM-free so it can be unit tested in the
 * `node` vitest environment (see colorThemes.test.ts).
 */

export interface ColorTheme {
  id: string;
  label: string;
  /** Main brand color: buttons, active nav item, focus rings */
  primary: string;
  /** Hover / active shade of `primary` */
  primaryHover: string;
  /** Secondary highlight color */
  accent: string;
  /** Swatch shown in the settings picker */
  swatch: string;
}

export const DEFAULT_THEME_ID = 'pear-green';

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'pear-green',
    label: 'Pear Green',
    primary: '#16a34a',
    primaryHover: '#15803d',
    accent: '#0ea5e9',
    swatch: '#16a34a',
  },
  {
    id: 'ocean-blue',
    label: 'Ocean Blue',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    accent: '#06b6d4',
    swatch: '#2563eb',
  },
  {
    id: 'grape',
    label: 'Grape',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    accent: '#ec4899',
    swatch: '#7c3aed',
  },
  {
    id: 'crimson',
    label: 'Crimson',
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    accent: '#f59e0b',
    swatch: '#dc2626',
  },
  {
    id: 'tangerine',
    label: 'Tangerine',
    primary: '#ea580c',
    primaryHover: '#c2410c',
    accent: '#facc15',
    swatch: '#ea580c',
  },
  {
    id: 'teal',
    label: 'Teal',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    accent: '#22c55e',
    swatch: '#0d9488',
  },
];

export function getColorTheme(id: string | null | undefined): ColorTheme {
  return (
    COLOR_THEMES.find((t) => t.id === id) ??
    COLOR_THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
  );
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalizes `#abc` / `abc` / `#aabbcc` to a lowercase `#aabbcc`. */
export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = HEX_RE.exec(value.trim());
  if (!m) return null;
  let hex = m[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return `#${hex}`;
}

export function isValidHex(value: string | null | undefined): boolean {
  return normalizeHex(value) !== null;
}

/** Relative luminance (WCAG 2.1) for a `#rrggbb` color. */
export function relativeLuminance(hex: string): number {
  const norm = normalizeHex(hex);
  if (!norm) return 0;
  const r = parseInt(norm.slice(1, 3), 16) / 255;
  const g = parseInt(norm.slice(3, 5), 16) / 255;
  const b = parseInt(norm.slice(5, 7), 16) / 255;
  const channel = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Picks the text color for a background.
 *
 * The app's established design uses white text on the brand color, so white is
 * preferred. We only fall back to dark text when white would be illegible
 * (contrast below 3:1), which keeps light custom colors readable.
 */
export function readableTextColor(hex: string): string {
  const lum = relativeLuminance(hex);
  const contrastWithWhite = 1.05 / (lum + 0.05);
  return contrastWithWhite >= 3 ? '#ffffff' : '#0f172a';
}

/** Darkens a hex color by `amount` (0-1) toward black. */
export function darkenHex(hex: string, amount: number): string {
  const norm = normalizeHex(hex);
  if (!norm) return hex;
  const factor = 1 - Math.min(Math.max(amount, 0), 1);
  const r = Math.round(parseInt(norm.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(norm.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(norm.slice(5, 7), 16) * factor);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Mixes two hex colors; `weight` is how much of `b` to use (0-1). */
export function mixHex(a: string, b: string, weight: number): string {
  const na = normalizeHex(a);
  const nb = normalizeHex(b);
  if (!na || !nb) return a;
  const w = Math.min(Math.max(weight, 0), 1);
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) =>
    Math.round(ch(na, i) * (1 - w) + ch(nb, i) * w)
      .toString(16)
      .padStart(2, '0')
  );
  return `#${out.join('')}`;
}

export interface ResolvedColorVars {
  '--primary': string;
  '--primary-hover': string;
  '--primary-contrast': string;
  '--accent': string;
}

/**
 * Resolves the CSS custom properties for a theme + optional custom primary.
 * A custom primary overrides the preset primary (and derives its own hover
 * and contrast), while the preset still supplies the accent.
 *
 * `--primary-soft` is intentionally not set here: it is derived in CSS with
 * `color-mix` so it stays correct in both light and dark mode.
 */
export function resolveColorVars(
  themeId: string | null | undefined,
  customPrimary?: string | null
): ResolvedColorVars {
  const theme = getColorTheme(themeId);
  const custom = normalizeHex(customPrimary);
  const primary = custom ?? theme.primary;
  const primaryHover = custom ? darkenHex(primary, 0.15) : theme.primaryHover;
  return {
    '--primary': primary,
    '--primary-hover': primaryHover,
    '--primary-contrast': readableTextColor(primary),
    '--accent': theme.accent,
  };
}
