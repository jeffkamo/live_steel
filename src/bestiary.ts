import type { MonsterFeature, PowerRollEffect } from './types'
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
    .map((f) => ({
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
      ...(f.effects && f.effects.length > 0
        ? { effects: f.effects.map(mapEffect) }
        : {}),
    }))
}

export function featuresForMonster(encounterName: string): MonsterFeature[] | undefined {
  const sb = lookupStatblock(encounterName)
  if (!sb) return undefined
  return mapFeatures(sb.features)
}
