import type { MaliceCoreId, MaliceRowRef, Monster } from './types'
import { lookupStatblock, type BestiaryStatblock } from './bestiary'

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
  effects?: RawEffect[]
}

function hasMaliceCost(cost: string | undefined): boolean {
  return cost != null && /malice/i.test(cost)
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

export type MaliceFeaturePick = {
  sourceKey: string
  name: string
  cost: string
  effect: string
}

function malicePicksFromStatblock(sb: BestiaryStatblock): MaliceFeaturePick[] {
  const raw = sb.features as RawFeature[] | undefined
  if (!raw?.length) return []
  const out: MaliceFeaturePick[] = []
  for (let fi = 0; fi < raw.length; fi++) {
    const f = raw[fi]!
    if (f.feature_type !== 'ability' && f.feature_type !== 'trait') continue
    if (hasMaliceCost(f.cost)) {
      const body =
        f.effects?.map((e) => formatEffectPlain(e)).filter((s) => s.length > 0).join(' ') ?? ''
      out.push({
        sourceKey: `f:${fi}`,
        name: f.name,
        cost: f.cost!,
        effect: body.length > 0 ? body : '—',
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
        sourceKey: `f:${fi}:e:${ei}`,
        name: label,
        cost: e.cost!,
        effect: body.length > 0 ? body : '—',
      })
    }
  }
  return out
}

export function malicePicksForMonsterRow(m: Monster): MaliceFeaturePick[] {
  if (m.custom != null) return []
  const direct = lookupStatblock(m.name)
  if (direct) {
    const picks = malicePicksFromStatblock(direct)
    if (picks.length > 0) return picks
  }
  const firstMinion = m.minions?.[0]?.name
  if (firstMinion) {
    const sb = lookupStatblock(firstMinion)
    if (sb) return malicePicksFromStatblock(sb)
  }
  return []
}

export function malicePickBySourceKey(m: Monster, sourceKey: string): MaliceFeaturePick | undefined {
  return malicePicksForMonsterRow(m).find((p) => p.sourceKey === sourceKey)
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
    out.push(r)
  }
  const head: MaliceRowRef[] = []
  if (!hasBrutal) head.push({ kind: 'core', coreId: 'brutal-effectiveness' })
  if (!hasMalicious) head.push({ kind: 'core', coreId: 'malicious-strike' })
  return [...head, ...out]
}

/** Same index math as {@link remapCaptainRefAfterMonsterMove} in data.ts (pair: group + monster). */
export function remapGroupMonsterRefAfterMove(
  ref: { groupIndex: number; monsterIndex: number },
  fromG: number,
  fromM: number,
  toG: number,
  insertIndex: number,
): { groupIndex: number; monsterIndex: number } {
  const g = ref.groupIndex
  let m = ref.monsterIndex
  if (g === fromG && m === fromM) {
    return { groupIndex: toG, monsterIndex: insertIndex }
  }
  if (g === fromG && m > fromM) {
    m -= 1
  }
  if (g === toG && m >= insertIndex) {
    m += 1
  }
  return { groupIndex: g, monsterIndex: m }
}

export function remapMaliceRowsAfterMonsterMove(
  rows: MaliceRowRef[] | undefined,
  fromG: number,
  fromM: number,
  toG: number,
  insertIndex: number,
): MaliceRowRef[] {
  const base = ensureMaliceRows(rows)
  return base.map((row) => {
    if (row.kind !== 'monster') return row
    const out = remapGroupMonsterRefAfterMove(
      { groupIndex: row.groupIndex, monsterIndex: row.monsterIndex },
      fromG,
      fromM,
      toG,
      insertIndex,
    )
    return { ...row, groupIndex: out.groupIndex, monsterIndex: out.monsterIndex }
  })
}

export function remapMaliceRowsAfterMonsterDeleted(
  rows: MaliceRowRef[] | undefined,
  groupIndex: number,
  removedMonsterIndex: number,
): MaliceRowRef[] {
  const base = ensureMaliceRows(rows)
  return base
    .filter(
      (row) =>
        row.kind !== 'monster' ||
        row.groupIndex !== groupIndex ||
        row.monsterIndex !== removedMonsterIndex,
    )
    .map((row) => {
      if (row.kind !== 'monster') return row
      if (row.groupIndex === groupIndex && row.monsterIndex > removedMonsterIndex) {
        return { ...row, monsterIndex: row.monsterIndex - 1 }
      }
      return row
    })
}

export function remapMaliceRowsAfterMonsterDuplicated(
  rows: MaliceRowRef[] | undefined,
  groupIndex: number,
  duplicatedMonsterIndex: number,
): MaliceRowRef[] {
  const base = ensureMaliceRows(rows)
  return base.map((row) => {
    if (row.kind !== 'monster') return row
    if (row.groupIndex === groupIndex && row.monsterIndex > duplicatedMonsterIndex) {
      return { ...row, monsterIndex: row.monsterIndex + 1 }
    }
    return row
  })
}

/** After removing the encounter group at `removedGroupIndex`, drop its malice rows and renumber higher groups. */
export function remapMaliceRowsAfterEncounterGroupRemoved(
  rows: MaliceRowRef[] | undefined,
  removedGroupIndex: number,
): MaliceRowRef[] {
  const base = ensureMaliceRows(rows)
  return base
    .filter((row) => row.kind !== 'monster' || row.groupIndex !== removedGroupIndex)
    .map((row) => {
      if (row.kind !== 'monster') return row
      if (row.groupIndex > removedGroupIndex) {
        return { ...row, groupIndex: row.groupIndex - 1 }
      }
      return row
    })
}

/** After inserting a new encounter group at `insertGroupIndex`, shift malice row group indices at or above it. */
export function remapMaliceRowsAfterEncounterGroupInserted(
  rows: MaliceRowRef[] | undefined,
  insertGroupIndex: number,
): MaliceRowRef[] {
  const base = ensureMaliceRows(rows)
  return base.map((row) => {
    if (row.kind !== 'monster') return row
    if (row.groupIndex >= insertGroupIndex) {
      return { ...row, groupIndex: row.groupIndex + 1 }
    }
    return row
  })
}

export function remapMaliceRowsAfterEncounterGroupsReordered(
  rows: MaliceRowRef[] | undefined,
  remapGroupIndex: (oldIndex: number) => number,
): MaliceRowRef[] {
  const base = ensureMaliceRows(rows)
  return base.map((row) =>
    row.kind === 'monster' ? { ...row, groupIndex: remapGroupIndex(row.groupIndex) } : row,
  )
}
