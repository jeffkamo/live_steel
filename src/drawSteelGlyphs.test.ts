import { describe, expect, it } from 'vitest'
import {
  DRAW_STEEL_DISTANCE_RULER_GLYPH,
  DRAW_STEEL_TIER_GLYPHS,
  featureIconToDrawSteelGlyph,
  keywordDrawSteelGlyph,
} from './drawSteelGlyphs'

describe('drawSteelGlyphs', () => {
  it('maps book keywords to chart characters', () => {
    expect(keywordDrawSteelGlyph('Melee')).toBe('t')
    expect(keywordDrawSteelGlyph('Ranged')).toBe('g')
    expect(keywordDrawSteelGlyph('Area')).toBe('e')
    expect(keywordDrawSteelGlyph('Burst')).toBe('b')
    expect(keywordDrawSteelGlyph('Versatile')).toBe('l')
    expect(keywordDrawSteelGlyph('Malice')).toBe('d')
    expect(keywordDrawSteelGlyph('Self')).toBe('f')
  })

  it('returns undefined for unmapped or placeholder keywords', () => {
    expect(keywordDrawSteelGlyph('Strike')).toBeUndefined()
    expect(keywordDrawSteelGlyph('-')).toBeUndefined()
    expect(keywordDrawSteelGlyph('Weapon')).toBeUndefined()
  })

  it('exposes three tier glyphs', () => {
    expect(DRAW_STEEL_TIER_GLYPHS).toEqual(['!', '@', '#'])
  })

  it('uses chart o for distance ruler (not melee t / ranged g)', () => {
    expect(DRAW_STEEL_DISTANCE_RULER_GLYPH).toBe('o')
    expect(keywordDrawSteelGlyph('area of effect')).toBe(DRAW_STEEL_DISTANCE_RULER_GLYPH)
  })
})

describe('featureIconToDrawSteelGlyph', () => {
  it('maps common bestiary emoji to chart characters (normalized VS16)', () => {
    expect(featureIconToDrawSteelGlyph('🗡️')).toBe('t')
    expect(featureIconToDrawSteelGlyph('🏹')).toBe('g')
    expect(featureIconToDrawSteelGlyph('⚔️')).toBe('t')
    expect(featureIconToDrawSteelGlyph('⭐️')).toBe('*')
    expect(featureIconToDrawSteelGlyph('🔳')).toBe('e')
    expect(featureIconToDrawSteelGlyph('❗️')).toBe('d')
    expect(featureIconToDrawSteelGlyph('👤')).toBe('f')
    expect(featureIconToDrawSteelGlyph('❇️')).toBe('c')
    expect(featureIconToDrawSteelGlyph('❕')).toBe('d')
    expect(featureIconToDrawSteelGlyph('🌀')).toBe('c')
  })

  it('returns undefined for unmapped icons', () => {
    expect(featureIconToDrawSteelGlyph('☠️')).toBeUndefined()
    expect(featureIconToDrawSteelGlyph(undefined)).toBeUndefined()
  })
})
