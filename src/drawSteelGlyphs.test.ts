import { describe, expect, it } from 'vitest'
import { DRAW_STEEL_TIER_GLYPHS, keywordDrawSteelGlyph } from './drawSteelGlyphs'

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
})
