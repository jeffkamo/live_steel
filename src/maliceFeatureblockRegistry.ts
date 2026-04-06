/**
 * Loads every Malice featureblock JSON under the bestiary (via Vite glob) and classifies it for
 * matching to stat blocks: tiered ancestry pools, generic ancestry tags, or named solos.
 */

type MaliceFeatureblockJson = {
  type?: string
  name: string
  level?: number
  features: unknown[]
}

const TIERED_BLOCK_NAMES = new Set(['Demon Malice', 'Undead Malice', 'War Dog Malice', 'Rival Malice'])

const TIERED_ANCESTRY_BY_BLOCK: Readonly<Record<string, string>> = {
  'Demon Malice': 'Demon',
  'Undead Malice': 'Undead',
  'War Dog Malice': 'War Dog',
  'Rival Malice': 'Rival',
}

/** Block titles that refer to a specific stat block name, not an ancestry tag. */
const POSSESSIVE_MALICE_TO_STATBLOCK: Readonly<Record<string, string>> = {
  "Ajax's Malice": 'Ajax the Invincible',
  "Rhodar's Malice": 'Count Rhodar von Glauer',
  "Lord Syuul's Malice": 'Lord Syuul',
  "Xorannox's Malice": 'Xorannox the Tyract',
}

export type TieredMaliceFeatureblock = {
  kind: 'tiered'
  ancestry: string
  blockName: string
  level: number
  features: unknown[]
}

export type AncestryTagMaliceFeatureblock = {
  kind: 'ancestryTag'
  ancestryTag: string
  blockName: string
  features: unknown[]
}

export type NamedStatblockMaliceFeatureblock = {
  kind: 'namedStatblock'
  statblockName: string
  blockName: string
  features: unknown[]
}

export type RegisteredMaliceFeatureblock =
  | TieredMaliceFeatureblock
  | AncestryTagMaliceFeatureblock
  | NamedStatblockMaliceFeatureblock

function classifyMaliceJson(json: MaliceFeatureblockJson): RegisteredMaliceFeatureblock | null {
  const name = json.name
  if (typeof name !== 'string' || name.length === 0) return null
  const features = json.features
  if (!Array.isArray(features) || features.length === 0) return null

  const soloName = POSSESSIVE_MALICE_TO_STATBLOCK[name]
  if (soloName != null) {
    return { kind: 'namedStatblock', statblockName: soloName, blockName: name, features }
  }

  if (TIERED_BLOCK_NAMES.has(name) && typeof json.level === 'number') {
    const ancestry = TIERED_ANCESTRY_BY_BLOCK[name]
    if (ancestry == null) return null
    return {
      kind: 'tiered',
      ancestry,
      blockName: name,
      level: json.level,
      features,
    }
  }

  if (name.endsWith(' Malice')) {
    const ancestryTag = name.slice(0, -' Malice'.length)
    if (ancestryTag.length === 0) return null
    return { kind: 'ancestryTag', ancestryTag, blockName: name, features }
  }

  return null
}

function loadJsonFromGlobModule(mod: unknown): MaliceFeatureblockJson | null {
  if (mod == null || typeof mod !== 'object') return null
  const rec = mod as Record<string, unknown>
  const direct = rec as MaliceFeatureblockJson
  if (direct.type === 'featureblock' && typeof direct.name === 'string') return direct
  const d = rec.default
  if (d != null && typeof d === 'object') {
    const j = d as MaliceFeatureblockJson
    if (j.type === 'featureblock' && typeof j.name === 'string') return j
  }
  return null
}

const maliceGlob = import.meta.glob('../data/bestiary/**/Features/*Malice*.json', {
  eager: true,
}) as Record<string, unknown>

const REGISTERED_MALICE_FEATUREBLOCKS: RegisteredMaliceFeatureblock[] = (() => {
  const out: RegisteredMaliceFeatureblock[] = []
  for (const mod of Object.values(maliceGlob)) {
    const json = loadJsonFromGlobModule(mod)
    if (!json) continue
    const row = classifyMaliceJson(json)
    if (row) out.push(row)
  }
  return out
})()

export function registeredMaliceFeatureblocks(): readonly RegisteredMaliceFeatureblock[] {
  return REGISTERED_MALICE_FEATUREBLOCKS
}
