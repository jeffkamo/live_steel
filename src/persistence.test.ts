import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { EncounterGroup, TerrainRowState } from './types'
import {
  serializeEncounterState,
  deserializeEncounterState,
  saveToLocalStorage,
  loadFromLocalStorage,
  saveEncounterIndex,
  loadEncounterIndex,
  migrateFromLegacyStorage,
  newEncounterId,
  deleteEncounterFromStorage,
  encounterStorageKey,
  STORAGE_KEY,
  STORAGE_VERSION,
  INDEX_KEY,
  type PersistedEncounterIndex,
} from './persistence'
import { cloneExampleEncounterGroups, cloneExampleTerrainRows, ENCOUNTER_GROUPS } from './data'
import { ensureMaliceRows } from './malice'

function makeGroups(): EncounterGroup[] {
  return cloneExampleEncounterGroups()
}

function makeTerrain(): TerrainRowState[] {
  return cloneExampleTerrainRows()
}

function makeTurnActed(): boolean[] {
  return ENCOUNTER_GROUPS.map(() => false)
}

describe('serializeEncounterState', () => {
  it('produces valid JSON with version, encounterGroups, terrainRows, groupTurnActed', () => {
    const groups = makeGroups()
    const terrain = makeTerrain()
    const turns = makeTurnActed()
    const json = serializeEncounterState(groups, terrain, turns)
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(parsed.version).toBe(STORAGE_VERSION)
    expect(Array.isArray(parsed.encounterGroups)).toBe(true)
    expect(Array.isArray(parsed.terrainRows)).toBe(true)
    expect(Array.isArray(parsed.groupTurnActed)).toBe(true)
    expect(Array.isArray(parsed.maliceRows)).toBe(true)
  })

  it('strips features from monsters to keep payload lean', () => {
    const groups = makeGroups()
    expect(groups[0]!.monsters[0]!.features!.length).toBeGreaterThan(0)
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const parsed = JSON.parse(json) as { encounterGroups: Array<{ monsters: Array<Record<string, unknown>> }> }
    for (const g of parsed.encounterGroups) {
      for (const m of g.monsters) {
        expect(m.features).toBeUndefined()
      }
    }
  })

  it('preserves stamina, conditions, and minion dead states', () => {
    const groups = makeGroups()
    groups[0]!.monsters[0]!.stamina = [3, 15]
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const parsed = JSON.parse(json) as { encounterGroups: EncounterGroup[] }
    expect(parsed.encounterGroups[0]!.monsters[0]!.stamina).toEqual([3, 15])
  })

  it('preserves group colors and ids', () => {
    const groups = makeGroups()
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const parsed = JSON.parse(json) as { encounterGroups: EncounterGroup[] }
    expect(parsed.encounterGroups[0]!.color).toBe(groups[0]!.color)
    expect(typeof parsed.encounterGroups[0]!.id).toBe('string')
  })

  it('preserves groupTurnActed values', () => {
    const turns = [true, false, true, false]
    const json = serializeEncounterState(makeGroups(), makeTerrain(), turns)
    const parsed = JSON.parse(json) as { groupTurnActed: boolean[] }
    expect(parsed.groupTurnActed).toEqual(turns)
  })

  it('includes squadsCollapsedByGroupId only for known group ids with true', () => {
    const groups = makeGroups()
    const gid = groups[0]!.id
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed(), ensureMaliceRows(undefined), {
      [gid]: true,
      'unknown-group-id': true,
    })
    const parsed = JSON.parse(json) as { squadsCollapsedByGroupId?: Record<string, boolean> }
    expect(parsed.squadsCollapsedByGroupId).toEqual({ [gid]: true })
  })

  it('omits squadsCollapsedByGroupId from JSON when nothing is collapsed', () => {
    const json = serializeEncounterState(makeGroups(), makeTerrain(), makeTurnActed())
    const parsed = JSON.parse(json) as { squadsCollapsedByGroupId?: Record<string, boolean> }
    expect(parsed.squadsCollapsedByGroupId).toBeUndefined()
  })
})

describe('deserializeEncounterState', () => {
  it('returns ok=false reason=empty for null', () => {
    expect(deserializeEncounterState(null)).toEqual({ ok: false, reason: 'empty' })
  })

  it('returns ok=false reason=empty for empty string', () => {
    expect(deserializeEncounterState('')).toEqual({ ok: false, reason: 'empty' })
  })

  it('returns ok=false reason=corrupt for invalid JSON', () => {
    expect(deserializeEncounterState('{not valid')).toEqual({ ok: false, reason: 'corrupt' })
  })

  it('returns ok=false reason=corrupt for missing required fields', () => {
    expect(deserializeEncounterState(JSON.stringify({ version: 1 }))).toEqual({
      ok: false,
      reason: 'corrupt',
    })
  })

  it('returns ok=false reason=version_mismatch for wrong version', () => {
    const payload = {
      version: 999,
      encounterGroups: [],
      terrainRows: [],
      groupTurnActed: [],
    }
    expect(deserializeEncounterState(JSON.stringify(payload))).toEqual({
      ok: false,
      reason: 'version_mismatch',
    })
  })

  it('returns ok=false reason=corrupt for encounterGroups with invalid group (missing id)', () => {
    const payload = {
      version: STORAGE_VERSION,
      encounterGroups: [{ monsters: [], color: 'red' }],
      terrainRows: [],
      groupTurnActed: [],
    }
    expect(deserializeEncounterState(JSON.stringify(payload))).toEqual({
      ok: false,
      reason: 'corrupt',
    })
  })

  it('round-trips valid state through serialize/deserialize', () => {
    const groups = makeGroups()
    const terrain = makeTerrain()
    const turns = [true, false, false, true]
    const json = serializeEncounterState(groups, terrain, turns)
    const result = deserializeEncounterState(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.groupTurnActed).toEqual(turns)
    expect(result.state.terrainRows).toEqual(terrain)
    expect(result.state.encounterGroups.length).toBe(groups.length)
    expect(result.state.encounterGroups[0]!.id).toBe(groups[0]!.id)
    expect(result.state.encounterGroups[0]!.color).toBe(groups[0]!.color)
    expect(result.state.maliceRows).toEqual(ensureMaliceRows(undefined))
    expect(result.state.squadsCollapsedByGroupId).toEqual({})
  })

  it('round-trips squadsCollapsedByGroupId', () => {
    const groups = makeGroups()
    const gid = groups[0]!.id
    const json = serializeEncounterState(
      groups,
      makeTerrain(),
      makeTurnActed(),
      ensureMaliceRows(undefined),
      { [gid]: true },
    )
    const result = deserializeEncounterState(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.squadsCollapsedByGroupId).toEqual({ [gid]: true })
  })

  it('returns ok=false reason=corrupt when squadsCollapsedByGroupId has non-boolean values', () => {
    const payload = {
      version: STORAGE_VERSION,
      encounterGroups: [{ id: 'g1', color: 'red', monsters: [] }],
      terrainRows: [],
      groupTurnActed: [],
      squadsCollapsedByGroupId: { g1: 'yes' },
    }
    expect(deserializeEncounterState(JSON.stringify(payload))).toEqual({
      ok: false,
      reason: 'corrupt',
    })
  })

  it('rehydrates features from bestiary on deserialize', () => {
    const groups = makeGroups()
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const parsed = JSON.parse(json) as { encounterGroups: Array<{ monsters: Array<Record<string, unknown>> }> }
    expect(parsed.encounterGroups[0]!.monsters[0]!.features).toBeUndefined()

    const result = deserializeEncounterState(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const rehydrated = result.state.encounterGroups[0]!.monsters[0]!
    expect(rehydrated.features).toBeDefined()
    expect(rehydrated.features!.length).toBeGreaterThan(0)
  })

  it('rehydrates features from first minion name for minion groups', () => {
    const groups = makeGroups()
    const minionGroup = groups.find((g) => g.monsters.some((m) => m.minions?.length))
    expect(minionGroup).toBeDefined()
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const result = deserializeEncounterState(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const rehydratedGroup = result.state.encounterGroups.find((g) =>
      g.monsters.some((m) => m.minions?.length),
    )
    const parent = rehydratedGroup?.monsters.find((m) => m.minions?.length)
    expect(parent?.features).toBeDefined()
    expect(parent!.features!.length).toBeGreaterThan(0)
  })

  it('preserves captain references through round-trip', () => {
    const groups = makeGroups()
    groups[2]!.monsters[0]!.captainId = { groupIndex: 0, monsterIndex: 1 }
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const result = deserializeEncounterState(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.encounterGroups[2]!.monsters[0]!.captainId).toEqual({
      groupIndex: 0,
      monsterIndex: 1,
    })
  })

  it('preserves minion dead state through round-trip', () => {
    const groups = makeGroups()
    const parent = groups.find((g) => g.monsters.some((m) => m.minions?.length))
    const horde = parent?.monsters.find((m) => m.minions?.length)
    if (horde?.minions) horde.minions[1]!.dead = true
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    const result = deserializeEncounterState(json)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const reParent = result.state.encounterGroups.find((g) =>
      g.monsters.some((m) => m.minions?.length),
    )
    const reHorde = reParent?.monsters.find((m) => m.minions?.length)
    expect(reHorde?.minions?.[1]?.dead).toBe(true)
    expect(reHorde?.minions?.[0]?.dead).toBe(false)
  })
})

describe('saveToLocalStorage / loadFromLocalStorage', () => {
  let store: Record<string, string>
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves and loads encounter state', () => {
    const groups = makeGroups()
    const terrain = makeTerrain()
    const turns = makeTurnActed()
    const result = saveToLocalStorage(groups, terrain, turns)
    expect(result.ok).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()

    const loaded = loadFromLocalStorage()
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.state.encounterGroups.length).toBe(groups.length)
    expect(loaded.state.terrainRows.length).toBe(terrain.length)
    expect(loaded.state.groupTurnActed.length).toBe(turns.length)
  })

  it('returns empty when no saved data exists', () => {
    const loaded = loadFromLocalStorage()
    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.reason).toBe('empty')
  })

  it('handles corrupt stored data gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{garbage!!!')
    const loaded = loadFromLocalStorage()
    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.reason).toBe('corrupt')
  })

  it('handles storage quota errors gracefully', () => {
    const throwing = {
      ...mockStorage,
      setItem: () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError') },
    } as Storage
    vi.stubGlobal('localStorage', throwing)
    const result = saveToLocalStorage(makeGroups(), makeTerrain(), makeTurnActed())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBeInstanceOf(DOMException)
  })

  it('handles localStorage.getItem throwing', () => {
    const throwing = {
      ...mockStorage,
      getItem: () => { throw new Error('SecurityError') },
    } as Storage
    vi.stubGlobal('localStorage', throwing)
    const loaded = loadFromLocalStorage()
    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.reason).toBe('corrupt')
  })

  it('saves and loads with an explicit encounter id', () => {
    const groups = makeGroups()
    const terrain = makeTerrain()
    const turns = makeTurnActed()
    const id = 'test-enc-1'
    const result = saveToLocalStorage(groups, terrain, turns, id)
    expect(result.ok).toBe(true)
    expect(localStorage.getItem(encounterStorageKey(id))).not.toBeNull()

    const loaded = loadFromLocalStorage(id)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    expect(loaded.state.encounterGroups.length).toBe(groups.length)
  })

  it('different encounter ids are isolated', () => {
    saveToLocalStorage(makeGroups(), makeTerrain(), makeTurnActed(), 'enc-a')
    expect(loadFromLocalStorage('enc-b').ok).toBe(false)
  })
})

describe('encounter index persistence', () => {
  let store: Record<string, string>
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves and loads encounter index', () => {
    const idx: PersistedEncounterIndex = {
      version: 1,
      encounters: [{ id: 'a', name: 'Goblin Ambush' }],
      activeId: 'a',
    }
    expect(saveEncounterIndex(idx).ok).toBe(true)
    const loaded = loadEncounterIndex()
    expect(loaded).not.toBeNull()
    expect(loaded!.encounters).toEqual(idx.encounters)
    expect(loaded!.activeId).toBe('a')
  })

  it('returns null when no index exists', () => {
    expect(loadEncounterIndex()).toBeNull()
  })

  it('returns null for corrupt index data', () => {
    localStorage.setItem(INDEX_KEY, '{bad json')
    expect(loadEncounterIndex()).toBeNull()
  })

  it('returns null for index with wrong version', () => {
    localStorage.setItem(INDEX_KEY, JSON.stringify({ version: 999, encounters: [], activeId: '' }))
    expect(loadEncounterIndex()).toBeNull()
  })

  it('newEncounterId returns unique strings', () => {
    const a = newEncounterId()
    const b = newEncounterId()
    expect(typeof a).toBe('string')
    expect(a.length).toBeGreaterThan(0)
    expect(a).not.toBe(b)
  })
})

describe('migrateFromLegacyStorage', () => {
  let store: Record<string, string>
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('migrates legacy single-encounter data to multi-encounter format', () => {
    const groups = makeGroups()
    const json = serializeEncounterState(groups, makeTerrain(), makeTurnActed())
    localStorage.setItem(STORAGE_KEY, json)

    const result = migrateFromLegacyStorage()
    expect(result).not.toBeNull()
    expect(result!.index.encounters.length).toBe(1)
    expect(result!.index.encounters[0]!.name).toBe('Encounter 1')
    expect(result!.state.ok).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    const newKey = encounterStorageKey(result!.index.activeId)
    expect(localStorage.getItem(newKey)).not.toBeNull()
    expect(localStorage.getItem(INDEX_KEY)).not.toBeNull()
  })

  it('returns null when no legacy data exists', () => {
    expect(migrateFromLegacyStorage()).toBeNull()
  })

  it('returns null for corrupt legacy data', () => {
    localStorage.setItem(STORAGE_KEY, '{bad')
    expect(migrateFromLegacyStorage()).toBeNull()
  })
})

describe('deleteEncounterFromStorage', () => {
  let store: Record<string, string>
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  } as Storage

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes encounter data from storage', () => {
    saveToLocalStorage(makeGroups(), makeTerrain(), makeTurnActed(), 'del-me')
    expect(loadFromLocalStorage('del-me').ok).toBe(true)
    deleteEncounterFromStorage('del-me')
    expect(loadFromLocalStorage('del-me').ok).toBe(false)
  })

  it('does not throw for non-existent encounter', () => {
    expect(() => deleteEncounterFromStorage('nonexistent')).not.toThrow()
  })
})
