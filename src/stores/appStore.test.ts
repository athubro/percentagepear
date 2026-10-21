import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from './appStore'
import { DEFAULT_THEME_ID, getColorTheme } from '../styles/colorThemes'

// Minimal localStorage + document stubs (vitest runs in the `node` env).
const store: Record<string, string> = {}
const styleProps: Record<string, string> = {}

beforeEach(() => {
  setActivePinia(createPinia())
  for (const k of Object.keys(store)) delete store[k]
  for (const k of Object.keys(styleProps)) delete styleProps[k]
  store['percentagepear-state-v1'] = ''
  delete store['percentagepear-state-v1']

  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
  })

  vi.stubGlobal('document', {
    documentElement: {
      classList: { toggle: vi.fn() },
      style: {
        setProperty: (k: string, v: string) => {
          styleProps[k] = v
        },
      },
    },
  })
})

describe('color theme preferences', () => {
  it('defaults to the default theme with no custom color', () => {
    const app = useAppStore()
    expect(app.preferences.colorTheme).toBe(DEFAULT_THEME_ID)
    expect(app.preferences.customPrimary).toBeNull()
  })

  it('applies the selected theme colors to the document', () => {
    const app = useAppStore()
    app.setColorTheme('ocean-blue')
    expect(app.preferences.colorTheme).toBe('ocean-blue')
    expect(styleProps['--primary']).toBe('#2563eb')
    expect(styleProps['--primary-hover']).toBe('#1d4ed8')
    expect(styleProps['--accent']).toBe('#06b6d4')
  })

  it('clears a custom color when switching themes', () => {
    const app = useAppStore()
    app.setCustomPrimary('#123456')
    app.setColorTheme('grape')
    expect(app.preferences.customPrimary).toBeNull()
    expect(styleProps['--primary']).toBe('#7c3aed')
  })

  it('applies a custom color and derives its hover shade', () => {
    const app = useAppStore()
    app.setCustomPrimary('#ff0000')
    expect(app.preferences.customPrimary).toBe('#ff0000')
    expect(styleProps['--primary']).toBe('#ff0000')
    expect(styleProps['--primary-hover']).toBe('#d90000')
  })

  it('ignores an invalid custom color', () => {
    const app = useAppStore()
    app.setCustomPrimary('#123456')
    app.setCustomPrimary('not-a-color')
    expect(app.preferences.customPrimary).toBe('#123456')
  })

  it('clears the custom color when passed null or empty', () => {
    const app = useAppStore()
    app.setCustomPrimary('#123456')
    app.setCustomPrimary(null)
    expect(app.preferences.customPrimary).toBeNull()
  })

  it('persists the color preferences', () => {
    const app = useAppStore()
    app.setColorTheme('teal')
    const raw = store['percentagepear-state-v1']
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw).preferences.colorTheme).toBe('teal')
  })

  it('resets back to the default theme', () => {
    const app = useAppStore()
    app.setCustomPrimary('#123456')
    app.setColorTheme('crimson')
    app.resetColorTheme()
    expect(app.preferences.colorTheme).toBe(DEFAULT_THEME_ID)
    expect(app.preferences.customPrimary).toBeNull()
    expect(styleProps['--primary']).toBe(getColorTheme(DEFAULT_THEME_ID).primary)
  })
})
