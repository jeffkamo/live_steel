/**
 * Character mappings from the official Draw Steel Glyphs chart (002.101).
 * Font: DrawSteelGlyphs-Regular (CC BY-SA 4.0 MCDM) — see public/fonts/DrawSteelGlyphs-LICENSE.txt
 */
export const DRAW_STEEL_KEYWORD_GLYPH: Readonly<Record<string, string>> = {
  melee: 't',
  ranged: 'g',
  area: 'e',
  burst: 'b',
  versatile: 'l',
  malice: 'd',
  self: 'f',
  special: 'c',
  targets: 'x',
  trait: '*',
  weak: 'w',
  average: 'v',
  strong: 's',
  'area of effect': 'o',
}

/** Tier band icons (chart: tier 1 ! …, tier 2 @ …, tier 3 # …) */
export const DRAW_STEEL_TIER_GLYPHS = ['!', '@', '#'] as const

export function keywordDrawSteelGlyph(keyword: string): string | undefined {
  const k = keyword.trim().toLowerCase()
  if (k === '-' || k === '') return undefined
  return DRAW_STEEL_KEYWORD_GLYPH[k]
}
