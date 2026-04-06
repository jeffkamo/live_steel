import type { EncounterGroup, MaliceCoreId, MaliceRowRef, Monster, PowerRollEffect } from './types'
import { baseName, lookupStatblock, type BestiaryStatblock } from './bestiary'
import { registeredMaliceFeatureblocks } from './maliceFeatureblockRegistry'

function newMaliceRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `malice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
  cost?: string
  usage?: string
  effects?: RawEffect[]
}

function hasMaliceCost(cost: string | undefined): boolean {
  return cost != null && /malice/i.test(cost)
}

/** Main / maneuver / triggered lines belong on the stat block even when they cost Malice. */
function featureHasUsage(f: RawFeature): boolean {
  return f.usage != null && f.usage.trim().length > 0
}

function formatEffectPlain(eff: RawEffect): string {
  const parts: string[] = []
  if (eff.roll) parts.push(eff.roll)
  if (eff.tier1) parts.push(`Tier 1: ${eff.tier1}`)
  if (eff.tier2) parts.push(`Tier 2: ${eff.tier2}`)
  if (eff.tier3) parts.push(`Tier 3: ${eff.tier3}`)
  if (eff.effect) parts.push(eff.effect)
  return parts.join(' ')
}

function rawEffectToPowerRoll(e: RawEffect): PowerRollEffect {
  return {
    ...(e.roll != null ? { roll: e.roll } : {}),
    ...(e.tier1 != null ? { tier1: e.tier1 } : {}),
    ...(e.tier2 != null ? { tier2: e.tier2 } : {}),
    ...(e.tier3 != null ? { tier3: e.tier3 } : {}),
    ...(e.name != null ? { name: e.name } : {}),
    ...(e.cost != null ? { cost: e.cost } : {}),
    ...(e.effect != null ? { effect: e.effect } : {}),
  }
}

export type MaliceFeaturePick = {
  sourceKey: string
  name: string
  cost: string
  /** Fallback plain text (search, legacy); prefer {@link MaliceFeaturePick.effects} when set. */
  effect: string
  /** When present, rendered like stat block effects (power rolls, tiers, rich text). */
  effects?: PowerRollEffect[]
  /** Badge label in the malice dashboard (ancestry pools); omit for creature-specific picks. */
  listTag?: string
}

/** Stable id for “the same” malice option across duplicate creatures / stat blocks (name + cost). */
export const MALICE_FEATURE_KEY_SEP = '\u0001'

export function maliceFeatureOptionKey(p: MaliceFeaturePick): string {
  return `${p.name}${MALICE_FEATURE_KEY_SEP}${p.cost}`
}

/** Leading integer in cost text (e.g. `"3 Malice"` → 3). Non-numeric costs sort after all numbers. */
export function maliceCostSortKey(cost: string): number {
  const m = cost.trim().match(/^(\d+)/)
  if (m) {
    const n = Number.parseInt(m[1]!, 10)
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
  }
  return Number.POSITIVE_INFINITY
}

function malicePicksFromFeatures(
  raw: RawFeature[] | undefined,
  opts: {
    sourceKeyPrefix: string
    omitFeaturesWithUsage: boolean
    listTag?: string
  },
): MaliceFeaturePick[] {
  if (!raw?.length) return []
  const { sourceKeyPrefix, omitFeaturesWithUsage, listTag } = opts
  const out: MaliceFeaturePick[] = []
  for (let fi = 0; fi < raw.length; fi++) {
    const f = raw[fi]!
    if (f.feature_type !== 'ability' && f.feature_type !== 'trait') continue
    if (omitFeaturesWithUsage && featureHasUsage(f)) continue
    if (hasMaliceCost(f.cost)) {
      const rawFx = f.effects ?? []
      const body =
        rawFx.map((e) => formatEffectPlain(e)).filter((s) => s.length > 0).join(' ') ?? ''
      const effects = rawFx.length > 0 ? rawFx.map(rawEffectToPowerRoll) : undefined
      out.push({
        sourceKey: `${sourceKeyPrefix}f:${fi}`,
        name: f.name,
        cost: f.cost!,
        effect: body.length > 0 ? body : '—',
        ...(effects != null ? { effects } : {}),
        ...(listTag != null ? { listTag } : {}),
      })
      continue
    }
    const effects = f.effects
    if (!effects) continue
    for (let ei = 0; ei < effects.length; ei++) {
      const e = effects[ei]!
      if (!hasMaliceCost(e.cost)) continue
      const label =
        e.name && e.name !== 'Effect' ? `${f.name} — ${e.name}` : f.name
      const body = formatEffectPlain(e)
      out.push({
        sourceKey: `${sourceKeyPrefix}f:${fi}:e:${ei}`,
        name: label,
        cost: e.cost!,
        effect: body.length > 0 ? body : '—',
        effects: [rawEffectToPowerRoll(e)],
        ...(listTag != null ? { listTag } : {}),
      })
    }
  }
  return out
}

function malicePicksFromStatblock(sb: BestiaryStatblock): MaliceFeaturePick[] {
  return malicePicksFromFeatures(sb.features as RawFeature[] | undefined, {
    sourceKeyPrefix: '',
    omitFeaturesWithUsage: true,
  })
}

/** Featureblock JSON titles end with " Malice"; UI tags show only the type (e.g. "Demon", "Goblin"). */
function maliceFeatureblockTagLabel(blockName: string): string {
  return blockName.replace(/\s+Malice$/u, '').trim()
}

function ancestryMalicePicksForStatblock(sb: BestiaryStatblock): MaliceFeaturePick[] {
  const creatureLevel = sb.level ?? 0
  const sbBase = baseName(sb.name)
  const out: MaliceFeaturePick[] = []

  for (const b of registeredMaliceFeatureblocks()) {
    if (b.kind === 'tiered') {
      if (!sb.ancestry.includes(b.ancestry)) continue
      if (b.level > creatureLevel) continue
      const listTag = `${maliceFeatureblockTagLabel(b.blockName)} (${b.level}+)`
      out.push(
        ...malicePicksFromFeatures(b.features as RawFeature[], {
          sourceKeyPrefix: `a:${b.ancestry}:${b.level}:`,
          omitFeaturesWithUsage: false,
          listTag,
        }),
      )
    } else if (b.kind === 'ancestryTag') {
      if (!sb.ancestry.includes(b.ancestryTag)) continue
      const slug = b.ancestryTag.replace(/\s+/g, '_')
      out.push(
        ...malicePicksFromFeatures(b.features as RawFeature[], {
          sourceKeyPrefix: `a:${slug}::`,
          omitFeaturesWithUsage: false,
          listTag: maliceFeatureblockTagLabel(b.blockName),
        }),
      )
    } else {
      if (baseName(b.statblockName) !== sbBase) continue
      const slug = b.statblockName.replace(/\s+/g, '_')
      out.push(
        ...malicePicksFromFeatures(b.features as RawFeature[], {
          sourceKeyPrefix: `n:${slug}:`,
          omitFeaturesWithUsage: false,
          listTag: maliceFeatureblockTagLabel(b.blockName),
        }),
      )
    }
  }
  return out
}

function bestiaryStatblockForMalice(m: Monster): BestiaryStatblock | undefined {
  if (m.custom != null) return undefined
  const direct = lookupStatblock(m.name)
  if (direct) return direct
  const firstMinion = m.minions?.[0]?.name
  return firstMinion ? lookupStatblock(firstMinion) : undefined
}

function malicePicksForResolvedStatblock(sb: BestiaryStatblock): MaliceFeaturePick[] {
  return [...malicePicksFromStatblock(sb), ...ancestryMalicePicksForStatblock(sb)]
}

export function malicePicksForMonsterRow(m: Monster): MaliceFeaturePick[] {
  if (m.custom != null) return []
  const sb = bestiaryStatblockForMalice(m)
  return sb ? malicePicksForResolvedStatblock(sb) : []
}

/**
 * Bestiary family name for malice UI (stat block title), matching how {@link malicePicksForMonsterRow}
 * resolves—solo uses the creature’s stat block; hordes use the first minion’s block when the parent has no direct block.
 */
export function maliceMonsterFamilyTag(m: Monster): string {
  if (m.custom != null) {
    const n = m.name.trim()
    return n.length > 0 ? n : 'Custom'
  }
  const sb = bestiaryStatblockForMalice(m)
  if (sb && malicePicksForResolvedStatblock(sb).length > 0) return sb.name
  return baseName(m.name)
}

export function malicePickBySourceKey(m: Monster, sourceKey: string): MaliceFeaturePick | undefined {
  return malicePicksForMonsterRow(m).find((p) => p.sourceKey === sourceKey)
}

/** First roster creature (group order, then monster order) that provides this malice option key. */
export function findMalicePickForFeatureKey(
  groups: readonly EncounterGroup[],
  featureOptionKey: string,
): { monster: Monster; pick: MaliceFeaturePick } | undefined {
  for (const g of groups) {
    for (const m of g.monsters) {
      for (const p of malicePicksForMonsterRow(m)) {
        if (maliceFeatureOptionKey(p) === featureOptionKey) {
          return { monster: m, pick: p }
        }
      }
    }
  }
  return undefined
}

export function findMonsterSlotByEncounterInstanceId(
  groups: readonly EncounterGroup[],
  encounterInstanceId: string,
): { groupIndex: number; monsterIndex: number; monster: Monster } | undefined {
  for (let gi = 0; gi < groups.length; gi++) {
    const ms = groups[gi]!.monsters
    for (let mi = 0; mi < ms.length; mi++) {
      const monster = ms[mi]!
      if (monster.encounterInstanceId === encounterInstanceId) {
        return { groupIndex: gi, monsterIndex: mi, monster }
      }
    }
  }
  return undefined
}

/**
 * Normalize persisted malice rows: current shape uses `featureOptionKey`; legacy used
 * `monsterEncounterId` + `sourceKey` or `groupIndex` + `monsterIndex` + `sourceKey`.
 */
export function normalizeMonsterMaliceRowRefs(
  rows: unknown[] | undefined,
  groups: EncounterGroup[],
): MaliceRowRef[] {
  if (rows == null || rows.length === 0) return []
  const out: MaliceRowRef[] = []
  for (const raw of rows) {
    if (raw == null || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    if (r.kind === 'core' && r.coreId === 'brutal-effectiveness') {
      out.push({ kind: 'core', coreId: 'brutal-effectiveness' })
      continue
    }
    if (r.kind === 'core' && r.coreId === 'malicious-strike') {
      out.push({ kind: 'core', coreId: 'malicious-strike' })
      continue
    }
    if (r.kind !== 'monster') continue
    const rowId = typeof r.id === 'string' ? r.id : newMaliceRowId()
    const fk = r.featureOptionKey
    if (typeof fk === 'string' && fk.length > 0) {
      out.push({ kind: 'monster', id: rowId, featureOptionKey: fk })
      continue
    }
    const sourceKey = typeof r.sourceKey === 'string' ? r.sourceKey : null
    if (sourceKey == null) continue
    const mid = r.monsterEncounterId
    if (typeof mid === 'string' && mid.length > 0) {
      const slot = findMonsterSlotByEncounterInstanceId(groups, mid)
      const pick = slot ? malicePickBySourceKey(slot.monster, sourceKey) : undefined
      if (pick) {
        out.push({ kind: 'monster', id: rowId, featureOptionKey: maliceFeatureOptionKey(pick) })
      }
      continue
    }
    const gi = typeof r.groupIndex === 'number' ? r.groupIndex : 0
    const mi = typeof r.monsterIndex === 'number' ? r.monsterIndex : 0
    const monster = groups[gi]?.monsters[mi]
    const pick = monster ? malicePickBySourceKey(monster, sourceKey) : undefined
    if (pick) {
      out.push({ kind: 'monster', id: rowId, featureOptionKey: maliceFeatureOptionKey(pick) })
    }
  }
  return out
}

/** Sorted id multiset fingerprint: changes when creatures are added, removed, or replaced (e.g. duplicate). */
export function monsterEncounterInstanceIdFingerprint(groups: readonly EncounterGroup[]): string {
  const parts: string[] = []
  for (const g of groups) {
    for (const m of g.monsters) {
      parts.push(m.encounterInstanceId ?? '')
    }
  }
  parts.sort()
  return parts.join('\0')
}

/** Drop creature malice rows when no roster creature still provides that feature (by name + cost key). */
export function pruneOrphanMaliceRows(
  groups: readonly EncounterGroup[],
  rows: MaliceRowRef[] | undefined,
): MaliceRowRef[] {
  if (rows == null || rows.length === 0) {
    return ensureMaliceRows(rows)
  }
  let removed = false
  const filtered = rows.filter((row) => {
    if (row.kind !== 'monster') return true
    if (!findMalicePickForFeatureKey(groups, row.featureOptionKey)) {
      removed = true
      return false
    }
    return true
  })
  if (!removed) return rows
  return ensureMaliceRows(filtered)
}

/** Core Director malice options (rule text is paraphrased for quick reference at the table). */
export const CORE_MALICE_FEATURES: Record<
  MaliceCoreId,
  { name: string; cost: string; effect: string }
> = {
  'brutal-effectiveness': {
    name: 'Brutal Effectiveness',
    cost: '1 Malice',
    effect:
      'When an enemy deals damage to a hero with a power roll, you can spend Malice to increase the damage tier by one (tier 1 → 2, or tier 2 → 3).',
  },
  'malicious-strike': {
    name: 'Malicious Strike',
    cost: '1 Malice',
    effect: 'When an enemy makes a strike, you can spend Malice to give that strike an edge.',
  },
}

export const DEFAULT_MALICE_ROW_REFS: readonly MaliceRowRef[] = [
  { kind: 'core', coreId: 'brutal-effectiveness' },
  { kind: 'core', coreId: 'malicious-strike' },
]

export function ensureMaliceRows(rows: MaliceRowRef[] | undefined): MaliceRowRef[] {
  if (rows == null || rows.length === 0) {
    return [...DEFAULT_MALICE_ROW_REFS]
  }
  let hasBrutal = false
  let hasMalicious = false
  const seenCreatureMaliceKeys = new Set<string>()
  const out: MaliceRowRef[] = []
  for (const r of rows) {
    if (r.kind === 'core' && r.coreId === 'brutal-effectiveness') {
      if (!hasBrutal) {
        hasBrutal = true
        out.push(r)
      }
      continue
    }
    if (r.kind === 'core' && r.coreId === 'malicious-strike') {
      if (!hasMalicious) {
        hasMalicious = true
        out.push(r)
      }
      continue
    }
    if (r.kind === 'monster') {
      if (seenCreatureMaliceKeys.has(r.featureOptionKey)) continue
      seenCreatureMaliceKeys.add(r.featureOptionKey)
    }
    out.push(r)
  }
  const head: MaliceRowRef[] = []
  if (!hasBrutal) head.push({ kind: 'core', coreId: 'brutal-effectiveness' })
  if (!hasMalicious) head.push({ kind: 'core', coreId: 'malicious-strike' })
  return [...head, ...out]
}

