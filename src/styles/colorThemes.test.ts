import { describe, it, expect } from 'vitest'
import {
  COLOR_THEMES,
  DEFAULT_THEME_ID,
  getColorTheme,
  isValidHex,
  normalizeHex,
  darkenHex,
  mixHex,
  readableTextColor,
  relativeLuminance,
  resolveColorVars,
} from './colorThemes'

describe('normalizeHex', () => {
  it('expands 3-digit hex', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc')
    expect(normalizeHex('abc')).toBe('#aabbcc')
  })

  it('lowercases and prefixes 6-digit hex', () => {
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc')
    expect(normalizeHex('#16A34A')).toBe('#16a34a')
  })

  it('rejects invalid values', () => {
    expect(normalizeHex('#gg')).toBeNull()
    expect(normalizeHex('#12345')).toBeNull()
    expect(normalizeHex('red')).toBeNull()
    expect(normalizeHex('')).toBeNull()
    expect(normalizeHex(null)).toBeNull()
    expect(normalizeHex(undefined)).toBeNull()
  })
})

describe('isValidHex', () => {
  it('accepts valid and rejects invalid', () => {
    expect(isValidHex('#16a34a')).toBe(true)
    expect(isValidHex('#abc')).toBe(true)
    expect(isValidHex('#12345')).toBe(false)
    expect(isValidHex('nope')).toBe(false)
  })
})

describe('getColorTheme', () => {
  it('returns the matching theme', () => {
    expect(getColorTheme('ocean-blue').id).toBe('ocean-blue')
  })

  it('falls back to the default theme for unknown ids', () => {
    expect(getColorTheme('does-not-exist').id).toBe(DEFAULT_THEME_ID)
    expect(getColorTheme(null).id).toBe(DEFAULT_THEME_ID)
    expect(getColorTheme(undefined).id).toBe(DEFAULT_THEME_ID)
  })

  it('has unique ids', () => {
    const ids = COLOR_THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('relativeLuminance', () => {
  it('ranks white above black', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 3)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 3)
  })
})

describe('readableTextColor', () => {
  it('uses white text on dark backgrounds', () => {
    expect(readableTextColor('#000000')).toBe('#ffffff')
    expect(readableTextColor('#16a34a')).toBe('#ffffff')
    expect(readableTextColor('#7c3aed')).toBe('#ffffff')
  })

  it('uses dark text on light backgrounds', () => {
    expect(readableTextColor('#ffffff')).toBe('#0f172a')
    expect(readableTextColor('#fef08a')).toBe('#0f172a')
  })
})

describe('darkenHex', () => {
  it('produces a darker color', () => {
    const darker = darkenHex('#16a34a', 0.2)
    expect(darker).not.toBe('#16a34a')
    expect(relativeLuminance(darker)).toBeLessThan(relativeLuminance('#16a34a'))
  })

  it('returns the same color at 0 amount', () => {
    expect(darkenHex('#16a34a', 0)).toBe('#16a34a')
  })
})

describe('mixHex', () => {
  it('returns the first color at weight 0', () => {
    expect(mixHex('#ff0000', '#0000ff', 0)).toBe('#ff0000')
  })

  it('returns the second color at weight 1', () => {
    expect(mixHex('#ff0000', '#0000ff', 1)).toBe('#0000ff')
  })

  it('blends midway', () => {
    expect(mixHex('#ff0000', '#0000ff', 0.5)).toBe('#800080')
  })
})

describe('resolveColorVars', () => {
  it('uses the theme primary when no custom color is set', () => {
    const vars = resolveColorVars('ocean-blue')
    expect(vars['--primary']).toBe('#2563eb')
    expect(vars['--primary-hover']).toBe('#1d4ed8')
    expect(vars['--accent']).toBe('#06b6d4')
  })

  it('lets a custom color override the primary', () => {
    const vars = resolveColorVars('ocean-blue', '#ff0000')
    expect(vars['--primary']).toBe('#ff0000')
    expect(vars['--primary-hover']).not.toBe('#1d4ed8')
    expect(vars['--accent']).toBe('#06b6d4')
  })

  it('normalizes a short custom hex', () => {
    expect(resolveColorVars('pear-green', '#abc')['--primary']).toBe('#aabbcc')
  })

  it('derives a readable contrast color', () => {
    expect(resolveColorVars('pear-green', '#000000')['--primary-contrast']).toBe('#ffffff')
    expect(resolveColorVars('pear-green', '#ffffff')['--primary-contrast']).toBe('#0f172a')
  })

  it('falls back to the default theme for unknown ids', () => {
    expect(resolveColorVars('nope')['--primary']).toBe(
      getColorTheme(DEFAULT_THEME_ID).primary
    )
  })

  it('ignores an invalid custom color', () => {
    expect(resolveColorVars('ocean-blue', 'not-a-color')['--primary']).toBe('#2563eb')
  })
})
