import type { EncounterGroup, TerrainRowState } from './types'
import { featuresForMonster } from './bestiary'

const STORAGE_KEY = 'live-steel-encounter'
const STORAGE_VERSION = 1

export type PersistedEncounterState = {
  version: number
  encounterGroups: EncounterGroup[]
  terrainRows: TerrainRowState[]
  groupTurnActed: boolean[]
}

export function serializeEncounterState(
  encounterGroups: EncounterGroup[],
  terrainRows: TerrainRowState[],
  groupTurnActed: boolean[],
): string {
  const stripped: EncounterGroup[] = encounterGroups.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(m)) {
        if (k !== 'features') out[k] = v
      }
      return out
    }),
  }))
  const payload: PersistedEncounterState = {
    version: STORAGE_VERSION,
    encounterGroups: stripped,
    terrainRows,
    groupTurnActed,
  }
  return JSON.stringify(payload)
}

function rehydrateFeatures(groups: EncounterGroup[]): EncounterGroup[] {
  return groups.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      const fromName = featuresForMonster(m.name)
      if (fromName && fromName.length > 0) return { ...m, features: fromName }
      if (m.minions && m.minions.length > 0) {
        const fromMinion = featuresForMonster(m.minions[0]!.name)
        if (fromMinion && fromMinion.length > 0) return { ...m, features: fromMinion }
      }
      return { ...m, features: m.features ?? [] }
    }),
  }))
}

function isValidPersistedState(o: unknown): o is PersistedEncounterState {
  if (o == null || typeof o !== 'object') return false
  const obj = o as Record<string, unknown>
  if (obj.version !== STORAGE_VERSION) return false
  if (!Array.isArray(obj.encounterGroups)) return false
  if (!Array.isArray(obj.terrainRows)) return false
  if (!Array.isArray(obj.groupTurnActed)) return false
  for (const g of obj.encounterGroups) {
    if (g == null || typeof g !== 'object') return false
    const grp = g as Record<string, unknown>
    if (typeof grp.id !== 'string') return false
    if (!Array.isArray(grp.monsters)) return false
    if (typeof grp.color !== 'string') return false
  }
  return true
}

export type DeserializeResult =
  | { ok: true; state: PersistedEncounterState }
  | { ok: false; reason: 'empty' | 'corrupt' | 'version_mismatch' }

export function deserializeEncounterState(raw: string | null): DeserializeResult {
  if (raw == null || raw === '') return { ok: false, reason: 'empty' }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isValidPersistedState(parsed)) {
      const obj = parsed as Record<string, unknown> | null
      if (obj != null && typeof obj === 'object' && typeof obj.version === 'number' && obj.version !== STORAGE_VERSION) {
        return { ok: false, reason: 'version_mismatch' }
      }
      return { ok: false, reason: 'corrupt' }
    }
    return {
      ok: true,
      state: {
        ...parsed,
        encounterGroups: rehydrateFeatures(parsed.encounterGroups),
      },
    }
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
}

export function saveToLocalStorage(
  encounterGroups: EncounterGroup[],
  terrainRows: TerrainRowState[],
  groupTurnActed: boolean[],
): { ok: true } | { ok: false; error: unknown } {
  try {
    const json = serializeEncounterState(encounterGroups, terrainRows, groupTurnActed)
    localStorage.setItem(STORAGE_KEY, json)
    return { ok: true }
  } catch (error) {
    return { ok: false, error }
  }
}

export function loadFromLocalStorage(): DeserializeResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return deserializeEncounterState(raw)
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
}

export { STORAGE_KEY, STORAGE_VERSION }
