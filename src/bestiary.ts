import type { Monster, MonsterFeature, PowerRollEffect } from './types'
import statblockData from '../data/bestiary/Monsters/statblocks.json'
import { parseWithCaptainEffect, type CaptainNumericBonuses } from './withCaptainEffect'

export type BestiaryStatblock = {
  name: string
  level?: number
  roles: string[]
  ancestry: string[]
  ev: string
  stamina: string
  speed: number
  movement?: string
  size: string
  stability: number
  free_strike: number
  might: number
  agility: number
  reason: number
  intuition: number
  presence: number
  with_captain?: string
  immunities?: string[]
  weaknesses?: string[]
  features?: RawFeature[]
}

type RawEffect = {
  name?: string
  cost?: string
  effect?: string
  roll?: string
  tier1?: string
  tier2?: string
  tier3?: string
}

type RawFeature = {
  type: string
  feature_type: string
  name: string
  icon?: string
  ability_type?: string
  cost?: string
  keywords?: string[]
  usage?: string
  distance?: string
  target?: string
  trigger?: string
  effects?: RawEffect[]
}

const bestiaryMap: ReadonlyMap<string, BestiaryStatblock> = (() => {
  const map = new Map<string, BestiaryStatblock>()
  for (const entry of (statblockData as { monsters: BestiaryStatblock[] }).monsters) {
    if (!map.has(entry.name)) {
      map.set(entry.name, entry)
    }
  }
  return map
})()

/**
 * Strip a trailing ordinal (e.g. "Goblin Assassin 1" → "Goblin Assassin")
 * so encounter-specific numbered copies map back to the base statblock.
 */
export function baseName(encounterName: string): string {
  return encounterName.replace(/\s+\d+$/, '')
}

export function lookupStatblock(name: string): BestiaryStatblock | undefined {
  return bestiaryMap.get(name) ?? bestiaryMap.get(baseName(name))
}

/** Parsed max stamina from the bestiary for this creature name (0 if unknown). */
export function maxStaminaForBestiaryName(name: string): number {
  const sb = lookupStatblock(name)
  if (!sb) return 0
  const n = Number.parseInt(sb.stamina, 10)
  return Number.isNaN(n) ? 0 : n
}

export function statblockNames(): readonly string[] {
  return [...bestiaryMap.keys()]
}

export function statblockCount(): number {
  return bestiaryMap.size
}

function hasMaliceCost(cost: string | undefined): boolean {
  return cost != null && /malice/i.test(cost)
}

/** Main / maneuver / triggered lines on the stat block (may still cost Malice). */
function featureHasUsage(f: RawFeature): boolean {
  return f.usage != null && f.usage.trim().length > 0
}

function mapEffect(raw: RawEffect): PowerRollEffect {
  return {
    ...(raw.roll != null ? { roll: raw.roll } : {}),
    ...(raw.tier1 != null ? { tier1: raw.tier1 } : {}),
    ...(raw.tier2 != null ? { tier2: raw.tier2 } : {}),
    ...(raw.tier3 != null ? { tier3: raw.tier3 } : {}),
    ...(raw.name != null ? { name: raw.name } : {}),
    ...(raw.cost != null ? { cost: raw.cost } : {}),
    ...(raw.effect != null ? { effect: raw.effect } : {}),
  }
}

export function mapFeatures(raw: RawFeature[] | undefined): MonsterFeature[] {
  if (!raw || raw.length === 0) return []
  return raw
    .filter((f) => f.feature_type === 'ability' || f.feature_type === 'trait')
    .filter((f) => !hasMaliceCost(f.cost) || featureHasUsage(f))
    .map((f) => {
      const keepMaliceEffects = featureHasUsage(f)
      const effects = f.effects?.filter((e) => keepMaliceEffects || !hasMaliceCost(e.cost))
      return {
        type: 'feature' as const,
        feature_type: f.feature_type as 'ability' | 'trait',
        name: f.name,
        ...(f.icon != null ? { icon: f.icon } : {}),
        ...(f.ability_type != null ? { ability_type: f.ability_type } : {}),
        ...(f.keywords && f.keywords.length > 0 ? { keywords: f.keywords } : {}),
        ...(f.usage != null ? { usage: f.usage } : {}),
        ...(f.distance != null ? { distance: f.distance } : {}),
        ...(f.target != null ? { target: f.target } : {}),
        ...(f.trigger != null ? { trigger: f.trigger } : {}),
        ...(f.cost != null ? { cost: f.cost } : {}),
        ...(effects && effects.length > 0
          ? { effects: effects.map(mapEffect) }
          : {}),
      }
    })
}

export function featuresForMonster(encounterName: string): MonsterFeature[] | undefined {
  const sb = lookupStatblock(encounterName)
  if (!sb) return undefined
  return mapFeatures(sb.features)
}

/**
 * Get the per-minion stamina interval from the bestiary.
 * Tries the parent monster name first, then falls back to the first minion's name.
 * Returns undefined when no bestiary entry is found.
 */
export function minionInterval(
  parentName: string,
  firstMinionName?: string,
): number | undefined {
  const sb = lookupStatblock(parentName) ?? (firstMinionName ? lookupStatblock(firstMinionName) : undefined)
  if (!sb) return undefined
  const parsed = Number.parseInt(sb.stamina, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * Per-minion stamina interval for pool math and UI: bestiary lookup, or custom
 * {@link CustomMonsterStats.perMinionStamina} / solo max stamina.
 */
export function minionIntervalFromMonster(parent: Monster): number | undefined {
  if (parent.custom != null) {
    const slot = parent.custom.perMinionStamina ?? 0
    if (slot > 0) return slot
    if (!parent.minions?.length && parent.stamina[1] > 0) return parent.stamina[1]
    return undefined
  }
  return minionInterval(parent.name, parent.minions?.[0]?.name)
}

/**
 * Build the interval thresholds array for a minion group.
 * E.g. interval=5, count=4 → [5, 10, 15, 20]
 */
export function minionThresholds(interval: number, minionCount: number): number[] {
  return Array.from({ length: minionCount }, (_, i) => interval * (i + 1))
}

/**
 * Stamina number shown for one minion-interval bracket (cumulative thresholds).
 * Killed brackets show 0; the active bracket shows current pool stamina;
 * full brackets show their cap (threshold).
 */
export function minionSegmentDisplay(current: number, prevThreshold: number, threshold: number): number {
  if (current <= prevThreshold) return 0
  if (current <= threshold) return current
  return threshold
}

export type MinionSegmentVisualState = 'dead' | 'atRisk' | 'healthy'

export function minionSegmentVisual(
  current: number,
  prevThreshold: number,
  threshold: number,
): { display: number; state: MinionSegmentVisualState } {
  const display = minionSegmentDisplay(current, prevThreshold, threshold)
  if (display === 0) return { display, state: 'dead' }
  if (display < threshold) return { display, state: 'atRisk' }
  return { display, state: 'healthy' }
}

/** FS, speed, and stability for roster rows — prefer bestiary, then encounter fields. */
/**
 * Build a read-only statblock shape from a custom encounter monster for {@link StatBlock} rendering.
 */
export function bestiaryStatblockFromCustomMonster(m: Monster): BestiaryStatblock | null {
  if (!m.custom) return null
  const c = m.custom
  const marip = m.marip ?? [0, 0, 0, 0, 0]
  const splitList = (s: string): string[] =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
  const imm = splitList(c.immunity)
  const weak = splitList(c.weakness)
  const headerLine = m.subtitle.trim()
  return {
    name: m.name,
    level: c.level > 0 ? c.level : undefined,
    roles: [],
    ancestry: headerLine ? [headerLine] : [],
    ev: (c.ev ?? '').trim() ? (c.ev ?? '').trim() : '—',
    stamina: String(m.stamina[1]),
    speed: m.dist,
    movement: c.movement.trim() || undefined,
    size: c.size.trim() || '—',
    stability: m.stab,
    free_strike: m.fs,
    might: marip[0]!,
    agility: marip[1]!,
    reason: marip[2]!,
    intuition: marip[3]!,
    presence: marip[4]!,
    ...(imm.length > 0 ? { immunities: imm } : {}),
    ...(weak.length > 0 ? { weaknesses: weak } : {}),
  }
}

function rosterCombatStatsBase(m: Monster): { fs: number; spd: number; stab: number } {
  if (m.custom != null) {
    return { fs: m.fs, spd: m.dist, stab: m.stab }
  }
  const sb =
    lookupStatblock(m.name) ?? (m.minions?.[0] ? lookupStatblock(m.minions[0].name) : undefined)
  if (sb) {
    return { fs: sb.free_strike, spd: sb.speed, stab: sb.stability }
  }
  return { fs: m.fs, spd: m.dist, stab: m.stab }
}

/**
 * When a minion horde has a captain, numeric parts of {@link BestiaryStatblock.with_captain}
 * (speed, stamina, free strike, stability) apply to roster FS / SPD / Stab.
 */
export function captainNumericBonusesFromMonster(m: Monster): CaptainNumericBonuses | null {
  if (!m.minions?.length || !m.captainId) return null
  const sb =
    lookupStatblock(m.name) ?? (m.minions[0] ? lookupStatblock(m.minions[0].name) : undefined)
  if (!sb?.with_captain) return null
  return parseWithCaptainEffect(sb.with_captain).numeric
}

export function rosterCombatStats(m: Monster): { fs: number; spd: number; stab: number } {
  const base = rosterCombatStatsBase(m)
  const bonus = captainNumericBonusesFromMonster(m)
  if (!bonus) return base
  return {
    fs: base.fs + bonus.freeStrike,
    spd: base.spd + bonus.speed,
    stab: base.stab + bonus.stability,
  }
}

export function rosterCombatStatsCaptainHighlights(m: Monster): {
  fs: boolean
  spd: boolean
  stab: boolean
} {
  const bonus = captainNumericBonusesFromMonster(m)
  if (!bonus) return { fs: false, spd: false, stab: false }
  return {
    fs: bonus.freeStrike !== 0,
    spd: bonus.speed !== 0,
    stab: bonus.stability !== 0,
  }
}

/**
 * Count how many minions the stamina pool says should be dead.
 * A minion is "suggested dead" when the pool's current stamina
 * has dropped to or below its lower-bound threshold.
 */
export function suggestedDeadCount(
  current: number,
  interval: number,
  minionCount: number,
): number {
  const thresholds = minionThresholds(interval, minionCount)
  let dead = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    const prevThreshold = i === 0 ? 0 : thresholds[i - 1]!
    if (current <= prevThreshold) dead++
  }
  return dead
}

/**
 * Returns true when a creature's bestiary entry contains at least one
 * feature or effect whose cost mentions "Malice".
 */
/**
 * Build a subtitle string from bestiary level and roles, e.g. "Level 2 Solo · Commander".
 */
export function bestiarySubtitle(sb: BestiaryStatblock): string {
  const parts: string[] = []
  if (sb.level != null) parts.push(`Level ${sb.level}`)
  parts.push(...sb.roles)
  return parts.join(' · ')
}

/**
 * Derive 1–3 character initials from a monster name
 * by taking the first letter of each word (max 3).
 */
export function deriveInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

export function isMaliceCreature(encounterName: string): boolean {
  const sb = lookupStatblock(encounterName)
  if (!sb?.features) return false
  return sb.features.some(
    (f) =>
      hasMaliceCost(f.cost) ||
      (f.effects?.some((e) => hasMaliceCost(e.cost)) ?? false),
  )
}
