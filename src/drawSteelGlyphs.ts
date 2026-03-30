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
  /** Same font slot as {@link DRAW_STEEL_DISTANCE_RULER_GLYPH} — triangle ruler / distance mark. */
  'area of effect': 'o',
}

/**
 * Ruler glyph before distance text ("Melee 1", "Ranged 10", …). Chart uses `o`, not the Melee (`t`) or Ranged (`g`) keyword letters.
 */
export const DRAW_STEEL_DISTANCE_RULER_GLYPH = 'o' as const

/** Tier band icons (chart: tier 1 ! …, tier 2 @ …, tier 3 # …) */
export const DRAW_STEEL_TIER_GLYPHS = ['!', '@', '#'] as const

export function keywordDrawSteelGlyph(keyword: string): string | undefined {
  const k = keyword.trim().toLowerCase()
  if (k === '-' || k === '') return undefined
  return DRAW_STEEL_KEYWORD_GLYPH[k]
}

/**
 * Bestiary feature `icon` strings are usually emoji. Map to Draw Steel font code points where the chart has a match; otherwise return undefined and the UI keeps the emoji.
 * Normalization strips emoji presentation selectors (U+FE0F) for lookup.
 *
 * Coverage (all distinct `icon` values under `data/bestiary`):
 * ⭐️ 🗡 🏹 ❗️ 🔳 ❇️ 👤 ⚔️ ❕ 🌀 → mapped below. ☠️ only → no chart analogue, stays emoji.
 */
const NORMALIZED_FEATURE_ICON_TO_GLYPH: Readonly<Record<string, string>> = {
  '🗡': 't',
  '🏹': 'g',
  '⚔': 't',
  '⭐': '*',
  '🔳': 'e',
  '❗': 'd',
  '❕': 'd',
  '👤': 'f',
  '❇': 'c',
  '🌀': 'c',
}

/** Regex matching a potency expression like "M < 1", "A < 0", etc. in tier text. */
export const POTENCY_PATTERN = /([MARIP])\s*<\s*(\d+)/g

export function featureIconToDrawSteelGlyph(icon: string | undefined): string | undefined {
  if (!icon) return undefined
  const trimmed = icon.trim()
  if (!trimmed) return undefined
  const key = trimmed.replace(/\uFE0F/g, '')
  return NORMALIZED_FEATURE_ICON_TO_GLYPH[key]
}
