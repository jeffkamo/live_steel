import type { BestiaryStatblock } from './bestiary'

/** Numeric bonuses parsed from a single {@link BestiaryStatblock.with_captain} line. */
export type CaptainNumericBonuses = {
  speed: number
  stamina: number
  freeStrike: number
  stability: number
}

const ZERO: CaptainNumericBonuses = { speed: 0, stamina: 0, freeStrike: 0, stability: 0 }

/**
 * Parses one `with_captain` rule string from the bestiary.
 * Recognized bonuses are applied to core stats; everything else is returned as
 * supplemental notes (edges, ranged/melee distance, lightning, etc.).
 */
export function parseWithCaptainEffect(text: string): {
  numeric: CaptainNumericBonuses
  supplementalNotes: string[]
} {
  const t = text.trim()
  if (!t) {
    return { numeric: { ...ZERO }, supplementalNotes: [] }
  }

  const speed = /^\+(\d+)\s+bonus to speed$/i.exec(t)
  if (speed) {
    return { numeric: { ...ZERO, speed: Number(speed[1]) }, supplementalNotes: [] }
  }

  const stamina = /^\+(\d+)\s+bonus to stamina$/i.exec(t)
  if (stamina) {
    return { numeric: { ...ZERO, stamina: Number(stamina[1]) }, supplementalNotes: [] }
  }

  const dmg = /^\+(\d+)\s+damage bonus to strikes$/i.exec(t)
  if (dmg) {
    return { numeric: { ...ZERO, freeStrike: Number(dmg[1]) }, supplementalNotes: [] }
  }

  const strikes = /^\+(\d+)\s+bonus to strikes$/i.exec(t)
  if (strikes) {
    return { numeric: { ...ZERO, freeStrike: Number(strikes[1]) }, supplementalNotes: [] }
  }

  const stab = /^\+(\d+)\s+bonus to stability$/i.exec(t)
  if (stab) {
    return { numeric: { ...ZERO, stability: Number(stab[1]) }, supplementalNotes: [] }
  }

  return { numeric: { ...ZERO }, supplementalNotes: [t] }
}

export function applyCaptainNumericToStatblock(
  sb: BestiaryStatblock,
  bonuses: CaptainNumericBonuses,
): BestiaryStatblock {
  const stam = Number.parseInt(sb.stamina, 10)
  const staminaOut =
    bonuses.stamina !== 0 && !Number.isNaN(stam)
      ? String(stam + bonuses.stamina)
      : sb.stamina
  return {
    ...sb,
    speed: sb.speed + bonuses.speed,
    stamina: staminaOut,
    free_strike: sb.free_strike + bonuses.freeStrike,
    stability: sb.stability + bonuses.stability,
  }
}

export type CaptainStatHighlights = {
  speed: boolean
  stamina: boolean
  freeStrike: boolean
  stability: boolean
}

export function captainHighlightsFromBonuses(b: CaptainNumericBonuses): CaptainStatHighlights {
  return {
    speed: b.speed !== 0,
    stamina: b.stamina !== 0,
    freeStrike: b.freeStrike !== 0,
    stability: b.stability !== 0,
  }
}
