import { describe, expect, it } from 'vitest'
import {
  defaultCustomMaliceFeatureData,
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
    const m = baseMonster({ name: 'Chimeron 2', encounterInstanceId: 'x' })
    expect(maliceMonsterFamilyTag(m)).toBe('Chimeron')
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
  it('returns ancestry malice tiers for demons (Chimeron)', () => {
    const m = baseMonster({ name: 'Chimeron' })
    const picks = malicePicksForMonsterRow(m)
    const soulburn = picks.find((p) => p.name === 'Soulburn')
    expect(soulburn).toBeDefined()
    expect(soulburn?.cost).toMatch(/Malice/i)
    expect(soulburn?.effect.length).toBeGreaterThan(0)
    expect(soulburn?.listTag).toBe('Demon (1+)')
    expect(picks.some((p) => p.name === 'Pain Absorption')).toBe(false)
  })

  it('returns Goblin Malice for goblin ancestry', () => {
    const m = baseMonster({ name: 'Goblin Assassin' })
    const picks = malicePicksForMonsterRow(m)
    const goblinMode = picks.find((p) => p.name === 'Goblin Mode')
    expect(goblinMode).toBeDefined()
    expect(goblinMode?.listTag).toBe('Goblin')
  })

  it("returns Ajax's Malice for Ajax the Invincible by stat block name", () => {
    const m = baseMonster({ name: 'Ajax the Invincible' })
    const picks = malicePicksForMonsterRow(m)
    const reason = picks.find((p) => p.name === 'Reason')
    expect(reason).toBeDefined()
    expect(reason?.listTag).toBe("Ajax's")
  })

  it('includes structured effects for tiered malice (Minotaur Bullseye)', () => {
    const m = baseMonster({ name: 'Minotaur' })
    const picks = malicePicksForMonsterRow(m)
    const bull = picks.find((p) => p.name === 'Bullseye')
    expect(bull?.effects?.length).toBe(1)
    expect(bull?.effects?.[0]?.effect).toMatch(/psychic impressions/i)
    expect(bull?.effects?.[0]?.tier1).toMatch(/line of effect/i)
    expect(bull?.effects?.[0]?.tier3).toMatch(/No effect/)
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
    const k = 'Soulburn\u00013 Malice'
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      { kind: 'monster' as const, id: 'a', featureOptionKey: k },
      { kind: 'monster' as const, id: 'b', featureOptionKey: k },
    ]
    const next = ensureMaliceRows(rows)
    expect(next.filter((r) => r.kind === 'monster')).toHaveLength(1)
  })

  it('preserves custom malice rows', () => {
    const def = defaultCustomMaliceFeatureData()
    const rows = [
      { kind: 'core' as const, coreId: 'malicious-strike' as const },
      { kind: 'custom' as const, id: 'cid', custom: def },
    ]
    const next = ensureMaliceRows(rows)
    const c = next.find((r) => r.kind === 'custom')
    expect(c?.kind).toBe('custom')
    if (c?.kind === 'custom') expect(c.custom.name).toBe(def.name)
  })
})

describe('findMalicePickForFeatureKey', () => {
  it('returns the first roster creature that has the feature', () => {
    const m1 = baseMonster({ name: 'Chimeron', encounterInstanceId: 'a' })
    const m2 = baseMonster({ name: 'Chimeron 2', encounterInstanceId: 'b' })
    const picks = malicePicksForMonsterRow(m1)
    const shadow = picks.find((p) => p.name === 'Soulburn')
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
  it('round-trips custom malice rows', () => {
    const groups: EncounterGroup[] = [{ id: 'g0', color: 'red', monsters: [] }]
    const raw = [
      {
        kind: 'custom',
        id: 'cm1',
        custom: { name: 'Test', cost: '2 Malice', description: 'Do a thing.' },
      },
    ]
    const out = normalizeMonsterMaliceRowRefs(raw, groups)
    expect(out).toEqual([
      {
        kind: 'custom',
        id: 'cm1',
        custom: expect.objectContaining({
          name: 'Test',
          cost: '2 Malice',
          description: 'Do a thing.',
        }),
      },
    ])
  })

  it('maps legacy groupIndex/monsterIndex + sourceKey to featureOptionKey', () => {
    const groups: EncounterGroup[] = [
      {
        id: 'g0',
        color: 'red',
        monsters: [baseMonster({ name: 'Chimeron', encounterInstanceId: 'legacy-1' })],
      },
    ]
    const picks = malicePicksForMonsterRow(groups[0]!.monsters[0]!)
    const shadow = picks.find((p) => p.name === 'Soulburn')
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

  it('keeps custom malice rows even with an empty roster', () => {
    const groups: EncounterGroup[] = []
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      {
        kind: 'custom' as const,
        id: 'x',
        custom: defaultCustomMaliceFeatureData(),
      },
    ]
    const next = pruneOrphanMaliceRows(groups, rows)
    expect(next.some((r) => r.kind === 'custom')).toBe(true)
  })

  it('keeps a row when another creature still provides the same feature', () => {
    const m1 = baseMonster({ name: 'Chimeron', encounterInstanceId: 'a' })
    const m2 = baseMonster({ name: 'Chimeron 2', encounterInstanceId: 'b' })
    const picks = malicePicksForMonsterRow(m1)
    const shadow = picks.find((p) => p.name === 'Soulburn')
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
