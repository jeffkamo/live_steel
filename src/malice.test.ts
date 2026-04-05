import { describe, expect, it } from 'vitest'
import {
  ensureMaliceRows,
  malicePicksForMonsterRow,
  remapMaliceRowsAfterEncounterGroupRemoved,
  remapMaliceRowsAfterMonsterDeleted,
  remapMaliceRowsAfterMonsterDuplicated,
  remapMaliceRowsAfterMonsterMove,
} from './malice'
import type { Monster } from './types'

function baseMonster(partial: Partial<Monster> & Pick<Monster, 'name'>): Monster {
  return {
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
})

describe('remapMaliceRowsAfterMonsterDeleted', () => {
  it('drops rows for removed monster and shifts higher indices in that group', () => {
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      { kind: 'monster' as const, id: 'a', groupIndex: 0, monsterIndex: 1, sourceKey: 'f:0' },
    ]
    const next = remapMaliceRowsAfterMonsterDeleted(rows, 0, 0)
    const monsterRows = next.filter((r) => r.kind === 'monster')
    expect(monsterRows).toHaveLength(1)
    expect((monsterRows[0] as { monsterIndex: number }).monsterIndex).toBe(0)
  })
})

describe('remapMaliceRowsAfterMonsterDuplicated', () => {
  it('shifts indices in the affected group after a duplicated monster slot', () => {
    const rows = [
      { kind: 'core' as const, coreId: 'brutal-effectiveness' as const },
      { kind: 'monster' as const, id: 'a', groupIndex: 0, monsterIndex: 2, sourceKey: 'f:0' },
    ]
    const next = remapMaliceRowsAfterMonsterDuplicated(rows, 0, 0)
    const m = next.find((r) => r.kind === 'monster') as { monsterIndex: number }
    expect(m.monsterIndex).toBe(3)
  })
})

describe('remapMaliceRowsAfterMonsterMove', () => {
  it('moves malice ref when the creature moves to another group', () => {
    const rows: import('./types').MaliceRowRef[] = [
      { kind: 'core', coreId: 'brutal-effectiveness' },
      { kind: 'monster', id: 'm', groupIndex: 0, monsterIndex: 0, sourceKey: 'f:0' },
    ]
    const next = remapMaliceRowsAfterMonsterMove(rows, 0, 0, 1, 1)
    const m = next.find((r) => r.kind === 'monster') as {
      groupIndex: number
      monsterIndex: number
    }
    expect(m.groupIndex).toBe(1)
    expect(m.monsterIndex).toBe(1)
  })
})

describe('remapMaliceRowsAfterEncounterGroupRemoved', () => {
  it('removes rows for the deleted group and decrements higher group indices', () => {
    const rows: import('./types').MaliceRowRef[] = [
      { kind: 'core', coreId: 'brutal-effectiveness' },
      { kind: 'monster', id: 'a', groupIndex: 1, monsterIndex: 0, sourceKey: 'f:0' },
    ]
    const next = remapMaliceRowsAfterEncounterGroupRemoved(rows, 0)
    const m = next.find((r) => r.kind === 'monster') as { groupIndex: number }
    expect(m.groupIndex).toBe(0)
  })
})
