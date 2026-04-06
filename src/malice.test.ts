import { describe, expect, it } from 'vitest'
import {
  ensureMaliceRows,
  findMalicePickForFeatureKey,
  findMonsterSlotByEncounterInstanceId,
  maliceCostSortKey,
  maliceFeatureOptionKey,
  maliceMonsterFamilyTag,
  malicePicksForMonsterRow,
  normalizeMonsterMaliceRowRefs,
  pruneOrphanMaliceRows,
} from './malice'
import type { EncounterGroup } from './types'
import type { Monster } from './types'

function baseMonster(partial: Partial<Monster> & Pick<Monster, 'name'>): Monster {
  return {
    encounterInstanceId: partial.encounterInstanceId ?? 'test-m-id',
    name: partial.name,
    subtitle: partial.subtitle ?? '',
    initials: partial.initials ?? 'GA',
    stamina: partial.stamina ?? [10, 15],
    marip: partial.marip ?? null,
    fs: partial.fs ?? 2,
    dist: partial.dist ?? 6,
    stab: partial.stab ?? 0,
    conditions: partial.conditions ?? [],
    ...('minions' in partial ? { minions: partial.minions } : {}),
    ...('features' in partial ? { features: partial.features } : {}),
    ...('custom' in partial ? { custom: partial.custom } : {}),
  }
}

describe('maliceMonsterFamilyTag', () => {
  it('uses bestiary stat block name for numbered encounter copies', () => {
    const m = baseMonster({ name: 'Goblin Assassin 2', encounterInstanceId: 'x' })
    expect(maliceMonsterFamilyTag(m)).toBe('Goblin Assassin')
  })
})

describe('maliceCostSortKey', () => {
  it('parses leading digit from typical cost strings', () => {
    expect(maliceCostSortKey('1 Malice')).toBe(1)
    expect(maliceCostSortKey('3 Malice')).toBe(3)
    expect(maliceCostSortKey('10 Malice')).toBe(10)
  })

  it('sends non-numeric costs to the end', () => {
    expect(maliceCostSortKey('Malice')).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('malicePicksForMonsterRow', () => {
  it('returns feature-level malice from bestiary (Goblin Assassin)', () => {
    const m = baseMonster({ name: 'Goblin Assassin' })
    const picks = malicePicksForMonsterRow(m)
    const shadow = picks.find((p) => p.name === 'Shadow Chains')
    expect(shadow).toBeDefined()
    expect(shadow?.cost).toMatch(/Malice/i)
    expect(shadow?.effect.length).toBeGreaterThan(0)
  })

  it('returns empty for custom creatures', () => {
    const m = baseMonster({
      name: 'Custom Thing',
      custom: {
        level: 1,
        ev: '1',
        monsterType: 'Solo',
        size: '1M',
        immunity: '',
        weakness: '',
        movement: '',
        notes: '',
      },
    })
    expect(malicePicksForMonsterRow(m)).toEqual([])
  })
})

describe('ensureMaliceRows', () => {
  it('defaults to two core rows', () => {
    expect(ensureMaliceRows(undefined)).toEqual([
      { kind: 'core', coreId: 'brutal-effectiveness' },
      { kind: 'core', coreId: 'malicious-strike' },
    ])
  })

  it('dedupes creature rows that share the same featureOptionKey', () => {
    const k = 'Shadow Chains\u00013 Malice'
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      { kind: 'monster' as const, id: 'a', featureOptionKey: k },
      { kind: 'monster' as const, id: 'b', featureOptionKey: k },
    ]
    const next = ensureMaliceRows(rows)
    expect(next.filter((r) => r.kind === 'monster')).toHaveLength(1)
  })
})

describe('findMalicePickForFeatureKey', () => {
  it('returns the first roster creature that has the feature', () => {
    const m1 = baseMonster({ name: 'Goblin Assassin', encounterInstanceId: 'a' })
    const m2 = baseMonster({ name: 'Goblin Assassin 2', encounterInstanceId: 'b' })
    const picks = malicePicksForMonsterRow(m1)
    const shadow = picks.find((p) => p.name === 'Shadow Chains')
    expect(shadow).toBeDefined()
    const key = maliceFeatureOptionKey(shadow!)
    const groups: EncounterGroup[] = [
      { id: 'g0', color: 'red', monsters: [m1] },
      { id: 'g1', color: 'blue', monsters: [m2] },
    ]
    const hit = findMalicePickForFeatureKey(groups, key)
    expect(hit?.monster.encounterInstanceId).toBe('a')
  })
})

describe('findMonsterSlotByEncounterInstanceId', () => {
  it('finds a creature in any group', () => {
    const m = baseMonster({ name: 'A', encounterInstanceId: 'mid' })
    const groups: EncounterGroup[] = [
      { id: 'g0', color: 'red', monsters: [] },
      { id: 'g1', color: 'blue', monsters: [m] },
    ]
    const slot = findMonsterSlotByEncounterInstanceId(groups, 'mid')
    expect(slot?.groupIndex).toBe(1)
    expect(slot?.monsterIndex).toBe(0)
    expect(slot?.monster.name).toBe('A')
  })
})

describe('normalizeMonsterMaliceRowRefs', () => {
  it('maps legacy groupIndex/monsterIndex + sourceKey to featureOptionKey', () => {
    const groups: EncounterGroup[] = [
      {
        id: 'g0',
        color: 'red',
        monsters: [baseMonster({ name: 'Goblin Assassin', encounterInstanceId: 'legacy-1' })],
      },
    ]
    const picks = malicePicksForMonsterRow(groups[0]!.monsters[0]!)
    const shadow = picks.find((p) => p.name === 'Shadow Chains')
    expect(shadow).toBeDefined()
    const raw = [
      {
        kind: 'monster',
        id: 'r1',
        groupIndex: 0,
        monsterIndex: 0,
        sourceKey: shadow!.sourceKey,
      },
    ]
    const out = normalizeMonsterMaliceRowRefs(raw, groups)
    expect(out).toEqual([
      { kind: 'monster', id: 'r1', featureOptionKey: maliceFeatureOptionKey(shadow!) },
    ])
  })
})

describe('pruneOrphanMaliceRows', () => {
  it('removes rows when no creature provides that feature', () => {
    const groups: EncounterGroup[] = [
      {
        id: 'g0',
        color: 'red',
        monsters: [baseMonster({ name: 'Only', encounterInstanceId: 'only' })],
      },
    ]
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      {
        kind: 'monster' as const,
        id: 'z',
        featureOptionKey: 'Nope Ability\u000199 Malice',
      },
    ]
    const next = pruneOrphanMaliceRows(groups, rows)
    expect(next.some((r) => r.kind === 'monster')).toBe(false)
  })

  it('keeps a row when another creature still provides the same feature', () => {
    const m1 = baseMonster({ name: 'Goblin Assassin', encounterInstanceId: 'a' })
    const m2 = baseMonster({ name: 'Goblin Assassin 2', encounterInstanceId: 'b' })
    const picks = malicePicksForMonsterRow(m1)
    const shadow = picks.find((p) => p.name === 'Shadow Chains')
    expect(shadow).toBeDefined()
    const key = maliceFeatureOptionKey(shadow!)
    const groups: EncounterGroup[] = [{ id: 'g0', color: 'red', monsters: [m2] }]
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      { kind: 'monster' as const, id: 'row', featureOptionKey: key },
    ]
    const next = pruneOrphanMaliceRows(groups, rows)
    expect(next.some((r) => r.kind === 'monster')).toBe(true)
  })
})
