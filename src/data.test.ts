import { describe, expect, it } from 'vitest'
import {
  conditionEntryFromLabel,
  cloneEncounterGroups,
  cloneTerrainRows,
  cloneExampleEncounterGroups,
  cloneExampleTerrainRows,
  computeMonsterInsertIndex,
  findConditionOnMonster,
  conditionStateTitle,
  conditionCatalogTooltip,
  normalizeStamina,
  applyStaminaDelta,
  otherGroupIndexForColor,
  nextAvailableColor,
  randomUnusedColor,
  monsterFromBestiary,
  blankCustomMonster,
  formatCustomSubtitle,
  monsterHasStatCard,
  applyCustomMonsterPatch,
  hordePoolMaxFromMinions,
  moveIndexInArray,
  mapMinionIndexAfterReorder,
  monsterDragDropIsValid,
  mapMinionDrawerSlotAfterMinionInserted,
  mapMinionDrawerSlotAfterMinionRemoved,
  mergeTopLevelMonsterIntoHorde,
  moveMonsterInEncounterWithCaptainRemap,
  parseConditionDragPayload,
  parseMonsterDragPayload,
  remapEotConfirmedAfterMinionTransferBetweenHordes,
  reorderMinionsInHorde,
  transferMinionBetweenHordes,
  remapEotConfirmedAfterMinionReorder,
  remapEncounterGroupIndex,
  remapEotConfirmedAfterMonsterMove,
  reorderEncounterGroupsWithCaptainRemap,
  applyExclusiveMinionCaptain,
  transferConditionBetweenCreatures,
  CONDITION_CATALOG,
  GROUP_COLOR_ORDER,
  MARIP_HEADERS,
  ENCOUNTER_GROUPS,
  TERRAIN_ROWS,
  buildCreatureOrdinalMap,
  totalCreaturesInGroup,
} from './data'
import type {
  CaptainRef,
  ConditionEntry,
  EncounterGroup,
  GroupColorId,
  MinionEntry,
  Monster,
} from './types'

describe('conditionEntryFromLabel', () => {
  it('creates a neutral condition entry', () => {
    expect(conditionEntryFromLabel('Bleeding')).toEqual({ label: 'Bleeding', state: 'neutral' })
  })
})

describe('buildCreatureOrdinalMap', () => {
  const base: Omit<Monster, 'name' | 'minions'> = {
    subtitle: '',
    initials: 'X',
    stamina: [1, 1],
    marip: null,
    fs: 0,
    dist: 0,
    stab: 0,
    conditions: [],
  }

  it('assigns unique ordinals to solos and minions; squad parent row has no entry', () => {
    const monsters: Monster[] = [
      { ...base, name: 'Solo A' },
      {
        ...base,
        name: 'Squad',
        minions: [
          { name: 'm1', initials: '1', conditions: [], dead: false },
          { name: 'm2', initials: '2', conditions: [], dead: false },
        ],
      },
      { ...base, name: 'Solo B' },
    ]
    const map = buildCreatureOrdinalMap(monsters)
    expect(map.get('0')).toBe(1)
    expect(map.get('1:0')).toBe(2)
    expect(map.get('1:1')).toBe(3)
    expect(map.get('2')).toBe(4)
    expect(totalCreaturesInGroup(monsters)).toBe(4)
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

  it('same-group swap with monster directly below (drop on next row)', () => {
    expect(computeMonsterInsertIndex(0, 0, 0, 1)).toBe(1)
    expect(computeMonsterInsertIndex(0, 1, 0, 2)).toBe(2)
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

  it('swaps with the monster directly below within the same group', () => {
    const groups: EncounterGroup[] = [
      { id: 'a', color: 'red', monsters: [mk('A'), mk('B'), mk('C')] },
    ]
    const next = moveMonsterInEncounterWithCaptainRemap(groups, 0, 0, 0, 1)
    expect(next!.map((g) => g.monsters.map((m) => m.name))).toEqual([['B', 'A', 'C']])
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

describe('parseMonsterDragPayload', () => {
  it('parses top-level and minion payloads', () => {
    expect(parseMonsterDragPayload(JSON.stringify({ fromGroup: 1, fromMonster: 2 }))).toEqual({
      fromGroup: 1,
      fromMonster: 2,
    })
    expect(parseMonsterDragPayload(JSON.stringify({ fromGroup: 0, fromMonster: 1, fromMinion: 3 }))).toEqual({
      fromGroup: 0,
      fromMonster: 1,
      fromMinion: 3,
    })
    expect(parseMonsterDragPayload('')).toBeNull()
    expect(parseMonsterDragPayload(JSON.stringify({ fromGroup: 'x', fromMonster: 0 }))).toBeNull()
  })
})

function monsterDragDropFixtureGroups(): EncounterGroup[] {
  const solo = (name: string): Monster => ({
    name,
    subtitle: 's',
    initials: 'S',
    stamina: [1, 1],
    marip: null,
    fs: 0,
    dist: 0,
    stab: 0,
    conditions: [],
  })
  const horde = (name: string): Monster => ({
    ...solo(name),
    minions: [
      { name: `${name}-m0`, initials: 'a', conditions: [], dead: false },
      { name: `${name}-m1`, initials: 'b', conditions: [], dead: false },
    ],
  })
  return [
    { id: 'g0', color: 'red', monsters: [solo('A'), solo('B'), horde('H0')] },
    { id: 'g1', color: 'blue', monsters: [solo('C'), solo('D'), horde('H1')] },
  ]
}

describe('monsterDragDropIsValid', () => {
  const g = monsterDragDropFixtureGroups()

  it('allows top-level only onto top-level rows (not same slot)', () => {
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 0, 1, null, g)).toBe(true)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 0, 0, null, g)).toBe(false)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 0, 0, 2, g)).toBe(false)
  })

  it('allows minion reorder within a horde or drop onto another horde minion row', () => {
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 2, fromMinion: 0 }, 0, 2, 1, g)).toBe(true)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 2, fromMinion: 0 }, 0, 2, 0, g)).toBe(false)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 2, fromMinion: 0 }, 0, 2, null, g)).toBe(false)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 2, fromMinion: 0 }, 0, 1, 0, g)).toBe(false)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 2, fromMinion: 0 }, 1, 2, 0, g)).toBe(true)
  })

  it('allows a solo top-level creature onto a horde minion row (draft into squad)', () => {
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 0, 2, 1, g)).toBe(true)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 0, 2, 0, g)).toBe(true)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 1, 2, 0, g)).toBe(true)
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 0 }, 0, 0, 0, g)).toBe(false)
  })

  it('blocks dropping a squad parent onto a minion row', () => {
    expect(monsterDragDropIsValid({ fromGroup: 0, fromMonster: 2 }, 0, 1, 0, g)).toBe(false)
  })
})

describe('mergeTopLevelMonsterIntoHorde', () => {
  it('removes the solo row, appends the creature as a minion, and recomputes pool max from bestiary', () => {
    const solo: Monster = {
      name: 'Goblin Warrior',
      subtitle: '',
      initials: 'W',
      stamina: [10, 15],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
    }
    const hordeParent: Monster = {
      name: 'Minions',
      subtitle: '',
      initials: 'M',
      stamina: [5, 5],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
      minions: [
        { name: 'Goblin Spinecleaver 1', initials: '1', conditions: [], dead: false },
      ],
    }
    const groups: EncounterGroup[] = [{ id: 'g', color: 'red', monsters: [solo, hordeParent] }]
    const next = mergeTopLevelMonsterIntoHorde(groups, 0, 0, 0, 1, 1)
    expect(next).not.toBeNull()
    expect(next![0]!.monsters).toHaveLength(1)
    const parent = next![0]!.monsters[0]!
    expect(parent.minions!.map((m) => m.name)).toEqual(['Goblin Spinecleaver 1', 'Goblin Warrior'])
    expect(parent.stamina).toEqual([15, 20])
  })
})

describe('reorderMinionsInHorde', () => {
  const horde = (): EncounterGroup[] => [
    {
      id: 'g',
      color: 'red',
      monsters: [
        {
          name: 'Minions',
          subtitle: 'H',
          initials: 'M',
          stamina: [1, 1],
          marip: null,
          fs: 0,
          dist: 0,
          stab: 0,
          conditions: [],
          minions: [
            { name: 'A', initials: 'A', conditions: [], dead: false },
            { name: 'B', initials: 'B', conditions: [], dead: false },
            { name: 'C', initials: 'C', conditions: [], dead: false },
          ],
        },
      ],
    },
  ]

  it('swaps adjacent minions downward', () => {
    const next = reorderMinionsInHorde(horde(), 0, 0, 0, 1)!
    expect(next[0]!.monsters[0]!.minions!.map((m) => m.name)).toEqual(['B', 'A', 'C'])
  })

  it('returns null for invalid indices', () => {
    expect(reorderMinionsInHorde(horde(), 0, 0, 0, 0)).toBeNull()
    expect(reorderMinionsInHorde(horde(), 0, 0, 9, 1)).toBeNull()
  })
})

describe('transferMinionBetweenHordes', () => {
  it('moves a minion into a horde in another encounter group', () => {
    const groups = monsterDragDropFixtureGroups()
    const next = transferMinionBetweenHordes(groups, 0, 2, 0, 1, 2, 0)!
    expect(next[0]!.monsters[2]!.minions!.map((m) => m.name)).toEqual(['H0-m1'])
    expect(next[1]!.monsters[2]!.minions!.map((m) => m.name)).toEqual(['H0-m0', 'H1-m0', 'H1-m1'])
  })

  it('moves a minion between two hordes in the same encounter group', () => {
    const solo = (name: string): Monster => ({
      name,
      subtitle: 's',
      initials: 'S',
      stamina: [1, 1],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
    })
    const horde = (name: string, n: number): Monster => ({
      ...solo(name),
      minions: Array.from({ length: n }, (_, i) => ({
        name: `${name}-${i}`,
        initials: 'x',
        conditions: [] as const,
        dead: false,
      })),
    })
    const oneGroup: EncounterGroup[] = [
      { id: 'g', color: 'red', monsters: [horde('A', 2), horde('B', 1)] },
    ]
    const next = transferMinionBetweenHordes(oneGroup, 0, 0, 0, 0, 1, 0)!
    expect(next[0]!.monsters[0]!.minions!.map((m) => m.name)).toEqual(['A-1'])
    expect(next[0]!.monsters[1]!.minions!.map((m) => m.name)).toEqual(['A-0', 'B-0'])
  })

  it('full-roster pool ceiling after moving a dead minion allows healing with +1', () => {
    const mk = (n: number, dead: boolean) => ({
      name: `Goblin Spinecleaver ${n}`,
      initials: 'x',
      conditions: [] as const,
      dead,
    })
    const hordeParent = (minions: MinionEntry[], stamina: [number, number]): Monster => ({
      name: 'Minions',
      subtitle: '',
      initials: 'M',
      stamina,
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
      minions,
    })
    const groups: EncounterGroup[] = [
      { id: 'g0', color: 'red', monsters: [hordeParent([mk(1, false), mk(2, true)], [5, 10])] },
      { id: 'g1', color: 'blue', monsters: [hordeParent([mk(3, false), mk(4, false)], [10, 10])] },
    ]
    const next = transferMinionBetweenHordes(groups, 0, 0, 1, 1, 0, 0)!
    const dest = next[1]!.monsters[0]!
    expect(dest.stamina).toEqual([10, 15])
    expect(applyStaminaDelta(dest.stamina[0], dest.stamina[1], 1)).toEqual([11, 15])
  })

  it('demotes the source parent when its last minion leaves', () => {
    const solo = (name: string): Monster => ({
      name,
      subtitle: 's',
      initials: 'S',
      stamina: [1, 1],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
    })
    const horde = (name: string, n: number): Monster => ({
      ...solo(name),
      minions: Array.from({ length: n }, (_, i) => ({
        name: `${name}-${i}`,
        initials: 'x',
        conditions: [] as const,
        dead: false,
      })),
    })
    const groups: EncounterGroup[] = [
      { id: 'g', color: 'red', monsters: [horde('A', 1), horde('B', 2)] },
    ]
    const next = transferMinionBetweenHordes(groups, 0, 0, 0, 0, 1, 0)!
    expect(next[0]!.monsters[0]!.minions).toBeUndefined()
    expect(next[0]!.monsters[1]!.minions!.map((m) => m.name)).toEqual(['A-0', 'B-0', 'B-1'])
  })
})

describe('remapEotConfirmedAfterMinionTransferBetweenHordes', () => {
  it('migrates keys across encounter groups', () => {
    const prev = new Map<number, Set<string>>([
      [0, new Set(['2:0:Bleeding'])],
      [1, new Set(['2:1:Slow'])],
    ])
    const next = remapEotConfirmedAfterMinionTransferBetweenHordes(prev, 2, 0, 2, 0, 1, 2, 0)
    expect(next.get(0)).toEqual(new Set())
    expect(next.get(1)).toEqual(new Set(['2:2:Slow', '2:0:Bleeding']))
  })
})

describe('mapMinionDrawerSlotAfterMinionRemoved', () => {
  it('shifts slots after the removed index', () => {
    expect(mapMinionDrawerSlotAfterMinionRemoved(1, 0)).toBe(0)
    expect(mapMinionDrawerSlotAfterMinionRemoved(1, 2)).toBe(1)
    expect(mapMinionDrawerSlotAfterMinionRemoved(1, 1)).toBeNull()
  })
})

describe('mapMinionDrawerSlotAfterMinionInserted', () => {
  it('shifts slots at or after the insert index', () => {
    expect(mapMinionDrawerSlotAfterMinionInserted(1, 0)).toBe(0)
    expect(mapMinionDrawerSlotAfterMinionInserted(1, 2)).toBe(3)
  })
})

describe('mapMinionIndexAfterReorder', () => {
  it('maps viewer slot after minion reorder', () => {
    expect(mapMinionIndexAfterReorder(0, 1, 0)).toBe(1)
    expect(mapMinionIndexAfterReorder(0, 1, 1)).toBe(0)
    expect(mapMinionIndexAfterReorder(0, 2, 2)).toBe(2)
  })
})

describe('remapEotConfirmedAfterMinionReorder', () => {
  it('rewrites minion EoT keys when minions reorder', () => {
    const prev = new Map<number, Set<string>>([[0, new Set(['0:1:Bleeding', '0:0:Slow'])]])
    const next = remapEotConfirmedAfterMinionReorder(prev, 1, 0, 0, 0, 1)
    expect(next.get(0)).toEqual(new Set(['0:0:Bleeding', '0:1:Slow']))
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

describe('applyExclusiveMinionCaptain', () => {
  const minion = (): MinionEntry => ({
    name: 'm',
    initials: 'm',
    conditions: [],
    dead: false,
  })

  it('clears the same captain ref from other hordes when assigning to a new horde', () => {
    const captain: CaptainRef = { groupIndex: 0, monsterIndex: 0 }
    const groups: EncounterGroup[] = [
      {
        id: 'g0',
        color: 'red',
        monsters: [
          {
            encounterInstanceId: 'solo',
            name: 'Solo',
            subtitle: '',
            initials: 'S',
            stamina: [1, 1],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
          },
          {
            encounterInstanceId: 'horde1',
            name: 'Horde1',
            subtitle: '',
            initials: 'H',
            stamina: [10, 10],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
            minions: [minion()],
            captainId: captain,
          },
        ],
      },
      {
        id: 'g1',
        color: 'blue',
        monsters: [
          {
            encounterInstanceId: 'horde2',
            name: 'Horde2',
            subtitle: '',
            initials: 'H',
            stamina: [10, 10],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
            minions: [minion()],
          },
        ],
      },
    ]
    const next = applyExclusiveMinionCaptain(groups, 1, 0, captain)
    expect(next[0]!.monsters[1]!.captainId).toBeNull()
    expect(next[1]!.monsters[0]!.captainId).toEqual(captain)
  })

  it('allows two squads to use different captains with the same display name (distinct slots)', () => {
    const capA: CaptainRef = { groupIndex: 0, monsterIndex: 0 }
    const capB: CaptainRef = { groupIndex: 0, monsterIndex: 1 }
    const groups: EncounterGroup[] = [
      {
        id: 'g0',
        color: 'red',
        monsters: [
          {
            encounterInstanceId: 'a',
            name: 'Goblin',
            subtitle: '',
            initials: 'G',
            stamina: [1, 1],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
          },
          {
            encounterInstanceId: 'b',
            name: 'Goblin',
            subtitle: '',
            initials: 'G',
            stamina: [1, 1],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
          },
          {
            encounterInstanceId: 'h1',
            name: 'Squad1',
            subtitle: '',
            initials: 'S',
            stamina: [10, 10],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
            minions: [minion()],
            captainId: capA,
          },
          {
            encounterInstanceId: 'h2',
            name: 'Squad2',
            subtitle: '',
            initials: 'S',
            stamina: [10, 10],
            marip: null,
            fs: 0,
            dist: 0,
            stab: 0,
            conditions: [],
            minions: [minion()],
            captainId: capB,
          },
        ],
      },
    ]
    const next = applyExclusiveMinionCaptain(groups, 0, 3, capA)
    expect(next[0]!.monsters[2]!.captainId).toBeNull()
    expect(next[0]!.monsters[3]!.captainId).toEqual(capA)
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
  it('returns an empty array for a blank slate', () => {
    expect(cloneEncounterGroups()).toEqual([])
  })
})

describe('cloneTerrainRows', () => {
  it('returns an empty array for a blank slate', () => {
    expect(cloneTerrainRows()).toEqual([])
  })
})

describe('cloneExampleEncounterGroups', () => {
  it('assigns a non-empty id on each group', () => {
    const groups = cloneExampleEncounterGroups()
    for (const g of groups) {
      expect(typeof g.id).toBe('string')
      expect(g.id.length).toBeGreaterThan(0)
    }
  })

  it('returns deep copies that are independent of seed data', () => {
    const a = cloneExampleEncounterGroups()
    const b = cloneExampleEncounterGroups()
    a[0]!.monsters[0]!.stamina[0] = 999
    expect(b[0]!.monsters[0]!.stamina[0]).not.toBe(999)
  })

  it('assigns sequential colors from GROUP_COLOR_ORDER', () => {
    const groups = cloneExampleEncounterGroups()
    groups.forEach((g, i) => {
      expect(g.color).toBe(GROUP_COLOR_ORDER[i % GROUP_COLOR_ORDER.length])
    })
  })

  it('converts string conditions into ConditionEntry objects', () => {
    const groups = cloneExampleEncounterGroups()
    const first = groups[0]!.monsters[0]!
    expect(first.conditions[0]).toEqual({ label: 'Weakened', state: 'neutral' })
  })

  it('produces the correct number of groups', () => {
    expect(cloneExampleEncounterGroups().length).toBe(ENCOUNTER_GROUPS.length)
  })

  it('deeply clones marip arrays', () => {
    const a = cloneExampleEncounterGroups()
    const b = cloneExampleEncounterGroups()
    const marip = a[0]!.monsters[0]!.marip
    if (marip) {
      ;(marip as unknown as number[])[0] = 999
    }
    expect(b[0]!.monsters[0]!.marip![0]).not.toBe(999)
  })

  it('clones marip for Goblin Stinker from seed', () => {
    const groups = cloneExampleEncounterGroups()
    const stinker = groups[3]!.monsters[2]!
    expect(stinker.name).toBe('Goblin Stinker')
    expect(stinker.marip).toEqual([-2, 1, 0, 0, 2])
  })
})

describe('cloneExampleTerrainRows', () => {
  it('returns deep copies independent of seed data', () => {
    const a = cloneExampleTerrainRows()
    const b = cloneExampleTerrainRows()
    a[0]!.stamina[0] = 999
    expect(b[0]!.stamina[0]).not.toBe(999)
  })

  it('produces the correct number of rows', () => {
    expect(cloneExampleTerrainRows().length).toBe(TERRAIN_ROWS.length)
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

describe('randomUnusedColor', () => {
  it('returns null when all colors are used', () => {
    expect(randomUnusedColor([...GROUP_COLOR_ORDER])).toBeNull()
  })

  it('returns the only remaining color when one is unused', () => {
    const used = GROUP_COLOR_ORDER.slice(0, -1)
    expect(randomUnusedColor(used)).toBe(GROUP_COLOR_ORDER[GROUP_COLOR_ORDER.length - 1])
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

describe('custom monsters', () => {
  it('blankCustomMonster has zeroed stats and custom metadata', () => {
    const m = blankCustomMonster()
    expect(m.name).toBe('Custom monster')
    expect(m.custom).toEqual({
      level: 0,
      ev: '',
      perMinionStamina: 0,
      monsterType: '',
      size: '',
      immunity: '',
      weakness: '',
      movement: '',
      notes: '',
    })
    expect(m.stamina).toEqual([0, 0])
    expect(m.marip).toEqual([0, 0, 0, 0, 0])
    expect(m.fs + m.dist + m.stab).toBe(0)
    expect(m.features).toEqual([])
  })

  it('formatCustomSubtitle joins level and type', () => {
    expect(formatCustomSubtitle(0, '')).toBe('')
    expect(formatCustomSubtitle(3, 'Horde · Artillery')).toBe('Level 3 · Horde · Artillery')
    expect(formatCustomSubtitle(0, 'Solo')).toBe('Solo')
  })

  it('monsterHasStatCard is true for custom or featured creatures', () => {
    expect(monsterHasStatCard({ ...blankCustomMonster(), features: [] })).toBe(true)
    expect(
      monsterHasStatCard({
        name: 'X',
        subtitle: '',
        initials: 'X',
        stamina: [1, 1],
        marip: null,
        fs: 0,
        dist: 0,
        stab: 0,
        conditions: [],
        features: [{ type: 'feature', feature_type: 'trait', name: 'T' }],
      }),
    ).toBe(true)
    expect(
      monsterHasStatCard({
        name: 'X',
        subtitle: '',
        initials: 'X',
        stamina: [1, 1],
        marip: null,
        fs: 0,
        dist: 0,
        stab: 0,
        conditions: [],
      }),
    ).toBe(false)
  })

  it('applyCustomMonsterPatch updates merged custom fields and subtitle', () => {
    let m = blankCustomMonster()
    m = applyCustomMonsterPatch(m, {
      name: 'River Troll',
      custom: { level: 2, monsterType: 'Solo' },
      stamina: [12, 40],
      marip: [1, 2, 0, 0, -1],
    })
    expect(m.name).toBe('River Troll')
    expect(m.initials).toBe('RT')
    expect(m.subtitle).toBe('Level 2 · Solo')
    expect(m.stamina).toEqual([12, 40])
    expect(m.marip).toEqual([1, 2, 0, 0, -1])
  })

  it('applyCustomMonsterPatch clamps current stamina to new max', () => {
    let m = blankCustomMonster()
    m = { ...m, stamina: [50, 50] }
    m = applyCustomMonsterPatch(m, { stamina: [50, 10] })
    expect(m.stamina).toEqual([10, 10])
  })

  it('hordePoolMaxFromMinions uses custom perMinionStamina for each slot', () => {
    const base = blankCustomMonster()
    const m: Monster = {
      ...base,
      custom: { ...base.custom!, perMinionStamina: 8 },
      minions: [
        { name: 'Custom monster 1', initials: 'C', conditions: [], dead: false },
        { name: 'Custom monster 2', initials: 'C', conditions: [], dead: false },
      ],
    }
    expect(hordePoolMaxFromMinions(m, m.minions!)).toBe(16)
  })
})

describe('parseConditionDragPayload', () => {
  it('parses monster-row payload without fromMinion', () => {
    expect(
      parseConditionDragPayload(JSON.stringify({ fromGroup: 1, fromMonster: 2, label: 'Dazed' })),
    ).toEqual({ fromGroup: 1, fromMonster: 2, fromMinion: null, label: 'Dazed' })
  })

  it('parses minion payload with fromMinion', () => {
    expect(
      parseConditionDragPayload(JSON.stringify({ fromGroup: 0, fromMonster: 1, fromMinion: 0, label: 'Taunted' })),
    ).toEqual({ fromGroup: 0, fromMonster: 1, fromMinion: 0, label: 'Taunted' })
  })

  it('returns null for invalid JSON', () => {
    expect(parseConditionDragPayload('not json')).toBeNull()
  })

  it('returns null when fields are wrong type', () => {
    expect(parseConditionDragPayload(JSON.stringify({ fromGroup: 'x', fromMonster: 0, label: 'A' }))).toBeNull()
  })
})

describe('transferConditionBetweenCreatures', () => {
  const fresh = () => cloneExampleEncounterGroups()

  it('returns null when source and target are the same ref', () => {
    const groups = fresh()
    expect(
      transferConditionBetweenCreatures(
        groups,
        { groupIndex: 0, monsterIndex: 0, minionIndex: null },
        { groupIndex: 0, monsterIndex: 0, minionIndex: null },
        'Weakened',
      ),
    ).toBeNull()
  })

  it('returns null when source lacks the label', () => {
    const groups = fresh()
    expect(
      transferConditionBetweenCreatures(
        groups,
        { groupIndex: 0, monsterIndex: 0, minionIndex: null },
        { groupIndex: 0, monsterIndex: 1, minionIndex: null },
        'NonexistentCondition',
      ),
    ).toBeNull()
  })

  it('moves a condition between two monsters in the same group', () => {
    const g = fresh()
    const next = transferConditionBetweenCreatures(
      g,
      { groupIndex: 0, monsterIndex: 0, minionIndex: null },
      { groupIndex: 0, monsterIndex: 1, minionIndex: null },
      'Weakened',
    )
    expect(next).not.toBeNull()
    expect(next![0]!.monsters[0]!.conditions.some((c) => c.label === 'Weakened')).toBe(false)
    expect(next![0]!.monsters[1]!.conditions.find((c) => c.label === 'Weakened')).toEqual({
      label: 'Weakened',
      state: 'neutral',
    })
  })

  it('preserves EoT state when transferring', () => {
    const g = fresh()
    g[0]!.monsters[0]!.conditions = [{ label: 'Slowed', state: 'eot' }]
    g[0]!.monsters[1]!.conditions = []
    const next = transferConditionBetweenCreatures(
      g,
      { groupIndex: 0, monsterIndex: 0, minionIndex: null },
      { groupIndex: 0, monsterIndex: 1, minionIndex: null },
      'Slowed',
    )
    expect(next![0]!.monsters[1]!.conditions[0]).toEqual({ label: 'Slowed', state: 'eot' })
  })
})
