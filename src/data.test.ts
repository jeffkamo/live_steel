import { describe, expect, it } from 'vitest'
import {
  conditionEntryFromLabel,
  cloneEncounterGroups,
  cloneTerrainRows,
  findConditionOnMonster,
  conditionStateTitle,
  conditionCatalogTooltip,
  normalizeStamina,
  applyStaminaDelta,
  otherGroupIndexForColor,
  monsterFromBestiary,
  CONDITION_CATALOG,
  GROUP_COLOR_ORDER,
  MARIP_HEADERS,
  ENCOUNTER_GROUPS,
  TERRAIN_ROWS,
} from './data'
import type { ConditionEntry, GroupColorId } from './types'

describe('conditionEntryFromLabel', () => {
  it('creates a neutral condition entry', () => {
    expect(conditionEntryFromLabel('Bleeding')).toEqual({ label: 'Bleeding', state: 'neutral' })
  })
})

describe('normalizeStamina', () => {
  it('returns [0, 0] when max is 0', () => {
    expect(normalizeStamina(5, 0)).toEqual([0, 0])
  })

  it('clamps current to max', () => {
    expect(normalizeStamina(20, 10)).toEqual([10, 10])
  })

  it('clamps current at 0 when negative', () => {
    expect(normalizeStamina(-5, 10)).toEqual([0, 10])
  })

  it('rounds fractional values', () => {
    expect(normalizeStamina(3.7, 10.2)).toEqual([4, 10])
  })

  it('passes through normal values unchanged', () => {
    expect(normalizeStamina(5, 15)).toEqual([5, 15])
  })

  it('handles negative max by clamping to 0', () => {
    expect(normalizeStamina(5, -3)).toEqual([0, 0])
  })
})

describe('applyStaminaDelta', () => {
  it('adds positive delta to current', () => {
    expect(applyStaminaDelta(5, 15, 3)).toEqual([8, 15])
  })

  it('subtracts negative delta from current', () => {
    expect(applyStaminaDelta(5, 15, -2)).toEqual([3, 15])
  })

  it('clamps at max when delta exceeds remaining', () => {
    expect(applyStaminaDelta(14, 15, 5)).toEqual([15, 15])
  })

  it('clamps at 0 when delta underflows', () => {
    expect(applyStaminaDelta(3, 15, -10)).toEqual([0, 15])
  })

  it('returns [0, 0] for 0/0 with negative delta', () => {
    expect(applyStaminaDelta(0, 0, -5)).toEqual([0, 0])
  })

  it('creates new max from positive delta on 0/0', () => {
    expect(applyStaminaDelta(0, 0, 10)).toEqual([10, 10])
  })

  it('returns [0, 0] when max is 0 and current is not (edge case)', () => {
    expect(applyStaminaDelta(5, 0, 3)).toEqual([0, 0])
  })
})

describe('findConditionOnMonster', () => {
  const conditions: ConditionEntry[] = [
    { label: 'Bleeding', state: 'neutral' },
    { label: 'Dazed', state: 'eot' },
  ]

  it('finds an existing condition', () => {
    expect(findConditionOnMonster(conditions, 'Bleeding')).toEqual({ label: 'Bleeding', state: 'neutral' })
  })

  it('returns undefined for missing condition', () => {
    expect(findConditionOnMonster(conditions, 'Slowed')).toBeUndefined()
  })

  it('returns undefined for empty array', () => {
    expect(findConditionOnMonster([], 'Bleeding')).toBeUndefined()
  })
})

describe('conditionStateTitle', () => {
  it('returns "End of turn" for eot', () => {
    expect(conditionStateTitle('eot')).toBe('End of turn')
  })

  it('returns "Save ends" for se', () => {
    expect(conditionStateTitle('se')).toBe('Save ends')
  })

  it('returns undefined for neutral', () => {
    expect(conditionStateTitle('neutral')).toBeUndefined()
  })
})

describe('conditionCatalogTooltip', () => {
  it('returns inactive tooltip when no active entry', () => {
    expect(conditionCatalogTooltip('Bleeding', undefined)).toBe('Bleeding (inactive)')
  })

  it('returns neutral tooltip', () => {
    expect(conditionCatalogTooltip('Bleeding', { label: 'Bleeding', state: 'neutral' })).toBe('Bleeding (neutral)')
  })

  it('returns EoT tooltip', () => {
    expect(conditionCatalogTooltip('Dazed', { label: 'Dazed', state: 'eot' })).toBe('Dazed (End of turn)')
  })

  it('returns SE tooltip', () => {
    expect(conditionCatalogTooltip('Slowed', { label: 'Slowed', state: 'se' })).toBe('Slowed (Save ends)')
  })
})

describe('otherGroupIndexForColor', () => {
  const colors: GroupColorId[] = ['red', 'blue', 'green', 'red']

  it('finds another group with the same color', () => {
    expect(otherGroupIndexForColor('red', colors, 0)).toBe(3)
  })

  it('finds the first other group (not self)', () => {
    expect(otherGroupIndexForColor('red', colors, 3)).toBe(0)
  })

  it('returns null when no other group has the color', () => {
    expect(otherGroupIndexForColor('blue', colors, 1)).toBeNull()
  })

  it('returns null for a color not in the list', () => {
    expect(otherGroupIndexForColor('purple', colors, 0)).toBeNull()
  })
})

describe('cloneEncounterGroups', () => {
  it('returns deep copies that are independent of seed data', () => {
    const a = cloneEncounterGroups()
    const b = cloneEncounterGroups()
    a[0]!.monsters[0]!.stamina[0] = 999
    expect(b[0]!.monsters[0]!.stamina[0]).not.toBe(999)
  })

  it('assigns sequential colors from GROUP_COLOR_ORDER', () => {
    const groups = cloneEncounterGroups()
    groups.forEach((g, i) => {
      expect(g.color).toBe(GROUP_COLOR_ORDER[i % GROUP_COLOR_ORDER.length])
    })
  })

  it('converts string conditions into ConditionEntry objects', () => {
    const groups = cloneEncounterGroups()
    const first = groups[0]!.monsters[0]!
    expect(first.conditions[0]).toEqual({ label: 'Weakened', state: 'neutral' })
  })

  it('produces the correct number of groups', () => {
    expect(cloneEncounterGroups().length).toBe(ENCOUNTER_GROUPS.length)
  })

  it('deeply clones marip arrays', () => {
    const a = cloneEncounterGroups()
    const b = cloneEncounterGroups()
    const marip = a[0]!.monsters[0]!.marip
    if (marip) {
      (marip as number[])[0] = 999
    }
    expect(b[0]!.monsters[0]!.marip![0]).not.toBe(999)
  })

  it('preserves null marip for reserve slot', () => {
    const groups = cloneEncounterGroups()
    const reserve = groups[3]!.monsters[2]!
    expect(reserve.marip).toBeNull()
  })
})

describe('cloneTerrainRows', () => {
  it('returns deep copies independent of seed data', () => {
    const a = cloneTerrainRows()
    const b = cloneTerrainRows()
    a[0]!.stamina[0] = 999
    expect(b[0]!.stamina[0]).not.toBe(999)
  })

  it('converts string conditions into ConditionEntry objects', () => {
    const rows = cloneTerrainRows()
    expect(rows[0]!.conditions[0]).toEqual({ label: 'Slowed', state: 'neutral' })
  })

  it('produces the correct number of rows', () => {
    expect(cloneTerrainRows().length).toBe(TERRAIN_ROWS.length)
  })
})

describe('CONDITION_CATALOG', () => {
  it('contains 12 conditions', () => {
    expect(CONDITION_CATALOG.length).toBe(12)
  })

  it('is sorted alphabetically', () => {
    for (let i = 1; i < CONDITION_CATALOG.length; i++) {
      expect(CONDITION_CATALOG[i]!.localeCompare(CONDITION_CATALOG[i - 1]!, undefined, { sensitivity: 'base' })).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('MARIP_HEADERS', () => {
  it('has 5 entries for M, A, R, I, P', () => {
    expect(MARIP_HEADERS.map((h) => h.letter)).toEqual(['M', 'A', 'R', 'I', 'P'])
  })
})

describe('monsterFromBestiary', () => {
  it('creates a Monster with bestiary stats for a known monster', () => {
    const m = monsterFromBestiary('Goblin Assassin')
    expect(m.name).toBe('Goblin Assassin')
    expect(m.marip).not.toBeNull()
    expect(m.stamina[0]).toBeGreaterThan(0)
    expect(m.stamina[1]).toBeGreaterThan(0)
    expect(m.subtitle).toContain('Level')
    expect(m.conditions).toEqual([])
  })

  it('appends ordinal suffix to name when provided', () => {
    const m = monsterFromBestiary('Goblin Assassin', 3)
    expect(m.name).toBe('Goblin Assassin 3')
  })

  it('returns a blank monster for unknown bestiary name', () => {
    const m = monsterFromBestiary('Totally Fake Monster')
    expect(m.name).toBe('Totally Fake Monster')
    expect(m.marip).toBeNull()
    expect(m.stamina).toEqual([0, 0])
    expect(m.subtitle).toBe('')
  })

  it('populates features from the bestiary', () => {
    const m = monsterFromBestiary('Goblin Assassin')
    expect(m.features).toBeDefined()
    expect(m.features!.length).toBeGreaterThan(0)
  })

  it('derives initials from the monster name', () => {
    const m = monsterFromBestiary('Goblin Assassin')
    expect(m.initials).toBe('GA')
  })
})
