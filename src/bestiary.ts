import type { Monster, MonsterFeature, PowerRollEffect } from './types'
import statblockData from '../data/bestiary/Monsters/statblocks.json'

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

export function statblockNames(): readonly string[] {
  return [...bestiaryMap.keys()]
}

export function statblockCount(): number {
  return bestiaryMap.size
}

function hasMaliceCost(cost: string | undefined): boolean {
  return cost != null && /malice/i.test(cost)
}

function mapEffect(raw: RawEffect): PowerRollEffect {
  return {
    ...(raw.roll != null ? { roll: raw.roll } : {}),
    ...(raw.tier1 != null ? { tier1: raw.tier1 } : {}),
    ...(raw.tier2 != null ? { tier2: raw.tier2 } : {}),
    ...(raw.tier3 != null ? { tier3: raw.tier3 } : {}),
    ...(raw.name != null ? { name: raw.name } : {}),
    ...(raw.effect != null ? { effect: raw.effect } : {}),
  }
}

export function mapFeatures(raw: RawFeature[] | undefined): MonsterFeature[] {
  if (!raw || raw.length === 0) return []
  return raw
    .filter((f) => f.feature_type === 'ability' || f.feature_type === 'trait')
    .filter((f) => !hasMaliceCost(f.cost))
    .map((f) => {
      const effects = f.effects?.filter((e) => !hasMaliceCost(e.cost))
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
export function rosterCombatStats(m: Monster): { fs: number; spd: number; stab: number } {
  const sb =
    lookupStatblock(m.name) ?? (m.minions?.[0] ? lookupStatblock(m.minions[0].name) : undefined)
  if (sb) {
    return { fs: sb.free_strike, spd: sb.speed, stab: sb.stability }
  }
  return { fs: m.fs, spd: m.dist, stab: m.stab }
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
