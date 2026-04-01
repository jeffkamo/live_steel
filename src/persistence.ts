import type { EncounterGroup, Monster, TerrainRowState } from './types'
import { featuresForMonster } from './bestiary'

const STORAGE_KEY = 'live-steel-encounter'
const STORAGE_VERSION = 1

const INDEX_KEY = 'live-steel-encounter-index'
const INDEX_VERSION = 1

export type EncounterIndexEntry = {
  id: string
  name: string
}

export type PersistedEncounterIndex = {
  version: number
  encounters: EncounterIndexEntry[]
  activeId: string
}

export type PersistedEncounterState = {
  version: number
  encounterGroups: EncounterGroup[]
  terrainRows: TerrainRowState[]
  groupTurnActed: boolean[]
}

function encounterStorageKey(encounterId: string): string {
  return `${STORAGE_KEY}-${encounterId}`
}

export function newEncounterId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `enc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function serializeEncounterState(
  encounterGroups: EncounterGroup[],
  terrainRows: TerrainRowState[],
  groupTurnActed: boolean[],
): string {
  const stripped: EncounterGroup[] = encounterGroups.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      const { features: _features, ...rest } = m
      return rest as Monster
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
      if (m.custom != null) {
        return { ...m, features: [] }
      }
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

function isValidIndex(o: unknown): o is PersistedEncounterIndex {
  if (o == null || typeof o !== 'object') return false
  const obj = o as Record<string, unknown>
  if (obj.version !== INDEX_VERSION) return false
  if (!Array.isArray(obj.encounters)) return false
  if (typeof obj.activeId !== 'string') return false
  for (const e of obj.encounters) {
    if (e == null || typeof e !== 'object') return false
    const entry = e as Record<string, unknown>
    if (typeof entry.id !== 'string' || typeof entry.name !== 'string') return false
  }
  return true
}

export function saveEncounterIndex(index: PersistedEncounterIndex): { ok: true } | { ok: false; error: unknown } {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    return { ok: true }
  } catch (error) {
    return { ok: false, error }
  }
}

export function loadEncounterIndex(): PersistedEncounterIndex | null {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (raw == null || raw === '') return null
    const parsed = JSON.parse(raw)
    if (!isValidIndex(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Migrate legacy single-encounter storage to multi-encounter format.
 * If the old key exists but no index does, creates an index entry for it.
 */
export function migrateFromLegacyStorage(): {
  index: PersistedEncounterIndex
  state: DeserializeResult
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null || raw === '') return null
    const state = deserializeEncounterState(raw)
    if (!state.ok) return null
    const id = newEncounterId()
    const index: PersistedEncounterIndex = {
      version: INDEX_VERSION,
      encounters: [{ id, name: 'Encounter 1' }],
      activeId: id,
    }
    localStorage.setItem(encounterStorageKey(id), raw)
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
    localStorage.removeItem(STORAGE_KEY)
    return { index, state }
  } catch {
    return null
  }
}

export function saveToLocalStorage(
  encounterGroups: EncounterGroup[],
  terrainRows: TerrainRowState[],
  groupTurnActed: boolean[],
  encounterId?: string,
): { ok: true } | { ok: false; error: unknown } {
  try {
    const json = serializeEncounterState(encounterGroups, terrainRows, groupTurnActed)
    const key = encounterId != null ? encounterStorageKey(encounterId) : STORAGE_KEY
    localStorage.setItem(key, json)
    return { ok: true }
  } catch (error) {
    return { ok: false, error }
  }
}

export function loadFromLocalStorage(encounterId?: string): DeserializeResult {
  try {
    const key = encounterId != null ? encounterStorageKey(encounterId) : STORAGE_KEY
    const raw = localStorage.getItem(key)
    return deserializeEncounterState(raw)
  } catch {
    return { ok: false, reason: 'corrupt' }
  }
}

export function deleteEncounterFromStorage(encounterId: string): void {
  try {
    localStorage.removeItem(encounterStorageKey(encounterId))
  } catch {
    // swallow
  }
}

export { STORAGE_KEY, STORAGE_VERSION, INDEX_KEY, INDEX_VERSION, encounterStorageKey }
