import { describe, expect, it } from 'vitest'
import {
  conditionEntryFromLabel,
  cloneEncounterGroups,
  cloneTerrainRows,
  computeMonsterInsertIndex,
  findConditionOnMonster,
  conditionStateTitle,
  conditionCatalogTooltip,
  normalizeStamina,
  applyStaminaDelta,
  otherGroupIndexForColor,
  nextAvailableColor,
  monsterFromBestiary,
  moveIndexInArray,
  moveMonsterInEncounterWithCaptainRemap,
  remapEncounterGroupIndex,
  remapEotConfirmedAfterMonsterMove,
  reorderEncounterGroupsWithCaptainRemap,
  CONDITION_CATALOG,
  GROUP_COLOR_ORDER,
  MARIP_HEADERS,
  ENCOUNTER_GROUPS,
  TERRAIN_ROWS,
} from './data'
import type { ConditionEntry, EncounterGroup, GroupColorId, Monster } from './types'

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

describe('moveIndexInArray', () => {
  it('moves an item toward a higher index', () => {
    expect(moveIndexInArray(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a'])
  })

  it('moves an item toward a lower index', () => {
    expect(moveIndexInArray(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })

  it('returns a copy unchanged when from equals to', () => {
    expect(moveIndexInArray([1, 2, 3], 1, 1)).toEqual([1, 2, 3])
  })
})

describe('remapEncounterGroupIndex', () => {
  it('maps indices when moving from low to high', () => {
    expect(remapEncounterGroupIndex(0, 2, 0)).toBe(2)
    expect(remapEncounterGroupIndex(0, 2, 1)).toBe(0)
    expect(remapEncounterGroupIndex(0, 2, 2)).toBe(1)
  })

  it('maps indices when moving from high to low', () => {
    expect(remapEncounterGroupIndex(2, 0, 2)).toBe(0)
    expect(remapEncounterGroupIndex(2, 0, 0)).toBe(1)
    expect(remapEncounterGroupIndex(2, 0, 1)).toBe(2)
  })
})

describe('computeMonsterInsertIndex', () => {
  it('returns null for same slot noop', () => {
    expect(computeMonsterInsertIndex(0, 1, 0, 1)).toBeNull()
  })

  it('same-group insert before a later monster', () => {
    expect(computeMonsterInsertIndex(0, 0, 0, 2)).toBe(1)
  })

  it('same-group insert before an earlier monster', () => {
    expect(computeMonsterInsertIndex(0, 2, 0, 0)).toBe(0)
  })

  it('cross-group uses raw toMonster', () => {
    expect(computeMonsterInsertIndex(0, 0, 1, 1)).toBe(1)
  })
})

describe('moveMonsterInEncounterWithCaptainRemap', () => {
  const mk = (name: string, captain?: Monster['captainId']): Monster => ({
    name,
    subtitle: '',
    initials: name,
    stamina: [1, 1],
    marip: null,
    fs: 0,
    dist: 0,
    stab: 0,
    conditions: [],
    captainId: captain,
  })

  it('reorders within same group', () => {
    const groups: EncounterGroup[] = [
      { id: 'a', color: 'red', monsters: [mk('A'), mk('B'), mk('C')] },
    ]
    const next = moveMonsterInEncounterWithCaptainRemap(groups, 0, 2, 0, 0)
    expect(next!.map((g) => g.monsters.map((m) => m.name))).toEqual([['C', 'A', 'B']])
  })

  it('moves to another group and remaps captain ref to moved captain', () => {
    const groups: EncounterGroup[] = [
      { id: 'g0', color: 'red', monsters: [mk('Cap')] },
      { id: 'g1', color: 'blue', monsters: [mk('Minion', { groupIndex: 0, monsterIndex: 0 })] },
    ]
    const next = moveMonsterInEncounterWithCaptainRemap(groups, 0, 0, 1, 0)
    expect(next![1]!.monsters.map((m) => m.name)).toEqual(['Cap', 'Minion'])
    expect(next![1]!.monsters[1]!.captainId).toEqual({ groupIndex: 1, monsterIndex: 0 })
  })

  it('updates captain monsterIndex when captain target reorders within group', () => {
    const groups: EncounterGroup[] = [
      { id: 'a', color: 'red', monsters: [mk('Cap'), mk('M', { groupIndex: 0, monsterIndex: 0 })] },
    ]
    const next = moveMonsterInEncounterWithCaptainRemap(groups, 0, 1, 0, 0)
    expect(next![0]!.monsters[0]!.captainId).toEqual({ groupIndex: 0, monsterIndex: 1 })
  })
})

describe('remapEotConfirmedAfterMonsterMove', () => {
  it('migrates keys when moving monster cross-group', () => {
    const prev = new Map<number, Set<string>>([
      [0, new Set(['1:Bleeding'])],
      [1, new Set()],
    ])
    const next = remapEotConfirmedAfterMonsterMove(prev, 2, 0, 1, 1, 0)
    expect(next.get(0)).toEqual(new Set())
    expect(next.get(1)).toEqual(new Set(['0:Bleeding']))
  })

  it('rewrites indices for same-group reorder', () => {
    const prev = new Map<number, Set<string>>([[0, new Set(['2:Eot'])]])
    const next = remapEotConfirmedAfterMonsterMove(prev, 1, 0, 2, 0, 0)
    expect(next.get(0)).toEqual(new Set(['0:Eot']))
  })
})

describe('reorderEncounterGroupsWithCaptainRemap', () => {
  it('remaps captain groupIndex after reorder', () => {
    const groups = reorderEncounterGroupsWithCaptainRemap(
      [
        {
          id: 'g0',
          color: 'red',
          monsters: [{ name: 'A', subtitle: '', initials: 'A', stamina: [1, 1], marip: null, fs: 0, dist: 0, stab: 0, conditions: [] }],
        },
        {
          id: 'g1',
          color: 'blue',
          monsters: [
            {
              name: 'B',
              subtitle: '',
              initials: 'B',
              stamina: [1, 1],
              marip: null,
              fs: 0,
              dist: 0,
              stab: 0,
              conditions: [],
              captainId: { groupIndex: 0, monsterIndex: 0 },
            },
          ],
        },
      ],
      1,
      0,
    )
    expect(groups[0]!.monsters[0]!.captainId).toEqual({ groupIndex: 1, monsterIndex: 0 })
  })
})

describe('cloneEncounterGroups', () => {
  it('assigns a non-empty id on each group', () => {
    const groups = cloneEncounterGroups()
    for (const g of groups) {
      expect(typeof g.id).toBe('string')
      expect(g.id.length).toBeGreaterThan(0)
    }
  })

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
      ;(marip as unknown as number[])[0] = 999
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

describe('nextAvailableColor', () => {
  it('returns the first color when none are used', () => {
    expect(nextAvailableColor([])).toBe(GROUP_COLOR_ORDER[0])
  })

  it('skips already-used colors', () => {
    expect(nextAvailableColor(['red', 'orange', 'yellow', 'green'])).toBe('blue')
  })

  it('wraps around when all colors are used', () => {
    const allColors = [...GROUP_COLOR_ORDER]
    expect(nextAvailableColor(allColors)).toBe(GROUP_COLOR_ORDER[0])
  })

  it('returns the first unused color in order', () => {
    expect(nextAvailableColor(['red', 'blue'])).toBe('orange')
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
