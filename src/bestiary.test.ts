import { describe, expect, it } from 'vitest'
import {
  baseName,
  lookupStatblock,
  statblockNames,
  statblockCount,
  mapFeatures,
  featuresForMonster,
  isMaliceCreature,
  minionInterval,
  minionThresholds,
  minionSegmentDisplay,
  rosterCombatStats,
  suggestedDeadCount,
  bestiarySubtitle,
  deriveInitials,
  type BestiaryStatblock,
} from './bestiary'
import { cloneEncounterGroups } from './data'
import type { Monster } from './types'

describe('baseName', () => {
  it('strips trailing ordinal number', () => {
    expect(baseName('Goblin Assassin 1')).toBe('Goblin Assassin')
  })

  it('strips multi-digit ordinals', () => {
    expect(baseName('War Dog Conscript 12')).toBe('War Dog Conscript')
  })

  it('returns the name unchanged when there is no trailing number', () => {
    expect(baseName('Goblin Underboss')).toBe('Goblin Underboss')
  })

  it('does not strip numbers that are part of the name', () => {
    expect(baseName('R2D2')).toBe('R2D2')
  })

  it('strips only the last number after a space', () => {
    expect(baseName('Phase 2 Clone 3')).toBe('Phase 2 Clone')
  })
})

describe('statblockCount', () => {
  it('loads a non-trivial number of statblocks from the bestiary', () => {
    expect(statblockCount()).toBeGreaterThan(100)
  })
})

describe('statblockNames', () => {
  it('returns an array of unique names', () => {
    const names = statblockNames()
    expect(names.length).toBe(statblockCount())
    expect(new Set(names).size).toBe(names.length)
  })

  it('includes known monsters', () => {
    const names = statblockNames()
    expect(names).toContain('Goblin Assassin')
    expect(names).toContain('Goblin Underboss')
    expect(names).toContain('Goblin Spinecleaver')
  })
})

describe('lookupStatblock', () => {
  it('finds a monster by exact name', () => {
    const sb = lookupStatblock('Goblin Assassin')
    expect(sb).toBeDefined()
    expect(sb!.name).toBe('Goblin Assassin')
  })

  it('finds a monster by numbered encounter name', () => {
    const sb = lookupStatblock('Goblin Assassin 1')
    expect(sb).toBeDefined()
    expect(sb!.name).toBe('Goblin Assassin')
  })

  it('returns undefined for unknown name', () => {
    expect(lookupStatblock('Nonexistent Dragon')).toBeUndefined()
  })

  it('returns correct stats for a known monster', () => {
    const sb = lookupStatblock('Goblin Assassin')!
    expect(sb.stamina).toBe('15')
    expect(sb.speed).toBe(6)
    expect(sb.might).toBe(-2)
    expect(sb.agility).toBe(2)
    expect(sb.free_strike).toBe(2)
  })

  it('returns features array for a monster with features', () => {
    const sb = lookupStatblock('Goblin Assassin')!
    expect(sb.features).toBeDefined()
    expect(sb.features!.length).toBeGreaterThan(0)
  })
})

describe('mapFeatures', () => {
  it('returns empty array for undefined input', () => {
    expect(mapFeatures(undefined)).toEqual([])
  })

  it('returns empty array for empty array input', () => {
    expect(mapFeatures([])).toEqual([])
  })

  it('maps raw ability features correctly', () => {
    const raw = [
      {
        type: 'feature',
        feature_type: 'ability',
        name: 'Test Strike',
        icon: '🗡',
        ability_type: 'Signature Ability',
        keywords: ['Melee', 'Strike'],
        usage: 'Main action',
        distance: 'Melee 1',
        target: 'One creature',
        effects: [
          { roll: 'Power Roll + 2', tier1: '4 damage', tier2: '6 damage', tier3: '7 damage' },
          { name: 'Effect', effect: 'Extra damage on edge.' },
        ],
      },
    ]
    const features = mapFeatures(raw)
    expect(features).toHaveLength(1)
    expect(features[0]!.type).toBe('feature')
    expect(features[0]!.feature_type).toBe('ability')
    expect(features[0]!.name).toBe('Test Strike')
    expect(features[0]!.icon).toBe('🗡')
    expect(features[0]!.ability_type).toBe('Signature Ability')
    expect(features[0]!.keywords).toEqual(['Melee', 'Strike'])
    expect(features[0]!.usage).toBe('Main action')
    expect(features[0]!.distance).toBe('Melee 1')
    expect(features[0]!.target).toBe('One creature')
    expect(features[0]!.effects).toHaveLength(2)
    expect(features[0]!.effects![0]!.roll).toBe('Power Roll + 2')
    expect(features[0]!.effects![0]!.tier1).toBe('4 damage')
    expect(features[0]!.effects![1]!.name).toBe('Effect')
    expect(features[0]!.effects![1]!.effect).toBe('Extra damage on edge.')
  })

  it('maps raw trait features correctly', () => {
    const raw = [
      {
        type: 'feature',
        feature_type: 'trait',
        name: 'Crafty',
        icon: '⭐️',
        effects: [{ effect: 'Does not provoke.' }],
      },
    ]
    const features = mapFeatures(raw)
    expect(features).toHaveLength(1)
    expect(features[0]!.feature_type).toBe('trait')
    expect(features[0]!.name).toBe('Crafty')
    expect(features[0]!.effects![0]!.effect).toBe('Does not provoke.')
  })

  it('filters out non-ability/trait feature types', () => {
    const raw = [
      { type: 'feature', feature_type: 'subtrait', name: 'Sub', effects: [] },
      { type: 'feature', feature_type: 'ability', name: 'Real', effects: [] },
    ]
    const features = mapFeatures(raw)
    expect(features).toHaveLength(1)
    expect(features[0]!.name).toBe('Real')
  })

  it('omits optional fields when not present', () => {
    const raw = [
      { type: 'feature', feature_type: 'trait', name: 'Plain', effects: [] },
    ]
    const features = mapFeatures(raw)
    expect(features[0]).not.toHaveProperty('icon')
    expect(features[0]).not.toHaveProperty('keywords')
    expect(features[0]).not.toHaveProperty('cost')
  })

  it('includes cost field when present and non-malice', () => {
    const raw = [
      {
        type: 'feature',
        feature_type: 'ability',
        name: 'Costly',
        cost: '3 Stamina',
        effects: [],
      },
    ]
    const features = mapFeatures(raw)
    expect(features[0]!.cost).toBe('3 Stamina')
  })

  it('filters out features with malice cost', () => {
    const raw = [
      { type: 'feature', feature_type: 'ability', name: 'Normal Strike', effects: [] },
      { type: 'feature', feature_type: 'ability', name: 'Shadow Chains', cost: '3 Malice', effects: [] },
    ]
    const features = mapFeatures(raw)
    expect(features).toHaveLength(1)
    expect(features[0]!.name).toBe('Normal Strike')
  })

  it('filters out effects with malice cost within a feature', () => {
    const raw = [
      {
        type: 'feature',
        feature_type: 'ability',
        name: 'Mixed Ability',
        effects: [
          { name: 'Normal', effect: 'Does damage.' },
          { name: 'Malice Boost', cost: '5 Malice', effect: 'Extra damage.' },
        ],
      },
    ]
    const features = mapFeatures(raw)
    expect(features).toHaveLength(1)
    expect(features[0]!.effects).toHaveLength(1)
    expect(features[0]!.effects![0]!.name).toBe('Normal')
  })

  it('keeps feature when only some effects are malice', () => {
    const raw = [
      {
        type: 'feature',
        feature_type: 'ability',
        name: 'Sword Slash',
        effects: [
          { roll: 'Power Roll + 2', tier1: '4 damage', tier2: '6 damage', tier3: '7 damage' },
          { name: 'Malice Effect', cost: '2 Malice', effect: 'Extra slash.' },
        ],
      },
    ]
    const features = mapFeatures(raw)
    expect(features).toHaveLength(1)
    expect(features[0]!.effects).toHaveLength(1)
    expect(features[0]!.effects![0]!.roll).toBe('Power Roll + 2')
  })
})

describe('featuresForMonster', () => {
  it('returns features for a known monster', () => {
    const features = featuresForMonster('Goblin Assassin')
    expect(features).toBeDefined()
    expect(features!.length).toBeGreaterThan(0)
    expect(features!.some((f) => f.feature_type === 'ability')).toBe(true)
  })

  it('returns features when given a numbered encounter name', () => {
    const features = featuresForMonster('Goblin Assassin 1')
    expect(features).toBeDefined()
    expect(features!.length).toBeGreaterThan(0)
  })

  it('returns features matching the bestiary data', () => {
    const features = featuresForMonster('Goblin Assassin')!
    const swordStab = features.find((f) => f.name === 'Sword Stab')
    expect(swordStab).toBeDefined()
    expect(swordStab!.feature_type).toBe('ability')
    expect(swordStab!.ability_type).toBe('Signature Ability')
    expect(swordStab!.effects!.length).toBeGreaterThan(0)
  })

  it('returns undefined for unknown monster', () => {
    expect(featuresForMonster('Made Up Monster')).toBeUndefined()
  })
})

describe('isMaliceCreature', () => {
  it('returns true for a monster with a malice-cost feature', () => {
    expect(isMaliceCreature('Goblin Assassin')).toBe(true)
  })

  it('returns true when given a numbered encounter name', () => {
    expect(isMaliceCreature('Goblin Assassin 1')).toBe(true)
  })

  it('returns true for Goblin Underboss (has malice effects)', () => {
    expect(isMaliceCreature('Goblin Underboss')).toBe(true)
  })

  it('returns false for a monster without malice costs', () => {
    expect(isMaliceCreature('Goblin Spinecleaver')).toBe(false)
  })

  it('returns false for an unknown monster name', () => {
    expect(isMaliceCreature('Nonexistent Dragon')).toBe(false)
  })

  it('returns false for a monster with features but no malice costs', () => {
    expect(isMaliceCreature('Goblin Spinecleaver 1')).toBe(false)
  })
})

describe('cloneEncounterGroups bestiary integration', () => {
  it('populates features from bestiary for Goblin Assassin 1', () => {
    const groups = cloneEncounterGroups()
    const goblinAssassin = groups[0]!.monsters[0]!
    expect(goblinAssassin.name).toBe('Goblin Assassin 1')
    expect(goblinAssassin.features).toBeDefined()
    expect(goblinAssassin.features!.length).toBeGreaterThan(0)
    expect(goblinAssassin.features!.some((f) => f.name === 'Sword Stab')).toBe(true)
  })

  it('populates features from bestiary for Goblin Underboss', () => {
    const groups = cloneEncounterGroups()
    const underboss = groups[1]!.monsters[0]!
    expect(underboss.name).toBe('Goblin Underboss')
    expect(underboss.features).toBeDefined()
    expect(underboss.features!.some((f) => f.name === 'Swordplay')).toBe(true)
  })

  it('populates minion group features from first minion name', () => {
    const groups = cloneEncounterGroups()
    const minionGroup = groups[2]!.monsters[0]!
    expect(minionGroup.name).toBe('Minions')
    expect(minionGroup.features).toBeDefined()
    expect(minionGroup.features!.length).toBeGreaterThan(0)
    expect(minionGroup.features!.some((f) => f.name === 'Axe')).toBe(true)
  })

  it('populates features from bestiary for Goblin Stinker in default encounter', () => {
    const groups = cloneEncounterGroups()
    const stinker = groups[3]!.monsters[2]!
    expect(stinker.name).toBe('Goblin Stinker')
    expect(stinker.features).toBeDefined()
    expect(stinker.features!.some((f) => f.name === 'Toxic Winds')).toBe(true)
  })

  it('features from bestiary have correct MonsterFeature shape', () => {
    const groups = cloneEncounterGroups()
    const features = groups[0]!.monsters[0]!.features!
    for (const f of features) {
      expect(f.type).toBe('feature')
      expect(['ability', 'trait']).toContain(f.feature_type)
      expect(typeof f.name).toBe('string')
    }
  })

  it('bestiary features contain power roll effects with tier data', () => {
    const groups = cloneEncounterGroups()
    const features = groups[0]!.monsters[0]!.features!
    const withRoll = features.flatMap((f) => f.effects ?? []).filter((e) => e.roll)
    expect(withRoll.length).toBeGreaterThan(0)
    for (const e of withRoll) {
      expect(e.tier1).toBeDefined()
      expect(e.tier2).toBeDefined()
      expect(e.tier3).toBeDefined()
    }
  })
})

describe('minionInterval', () => {
  it('returns per-minion stamina from bestiary via parent name', () => {
    expect(minionInterval('Goblin Spinecleaver')).toBe(5)
  })

  it('resolves via first minion name when parent name not found', () => {
    expect(minionInterval('Minions', 'Goblin Spinecleaver 1')).toBe(5)
  })

  it('strips trailing ordinal from first minion name', () => {
    expect(minionInterval('Unknown Parent', 'Goblin Spinecleaver 3')).toBe(5)
  })

  it('returns undefined when no bestiary entry is found', () => {
    expect(minionInterval('Nonexistent', 'Also Nonexistent')).toBeUndefined()
  })

  it('returns undefined when no minion fallback is provided', () => {
    expect(minionInterval('Nonexistent')).toBeUndefined()
  })
})

describe('minionThresholds', () => {
  it('builds correct thresholds for 4 minions with interval 5', () => {
    expect(minionThresholds(5, 4)).toEqual([5, 10, 15, 20])
  })

  it('builds thresholds for 1 minion', () => {
    expect(minionThresholds(8, 1)).toEqual([8])
  })

  it('builds thresholds for 6 minions', () => {
    expect(minionThresholds(3, 6)).toEqual([3, 6, 9, 12, 15, 18])
  })

  it('returns empty array for zero minions', () => {
    expect(minionThresholds(5, 0)).toEqual([])
  })
})

describe('minionSegmentDisplay', () => {
  it('shows lowered tail after small damage (20→17)', () => {
    expect(minionSegmentDisplay(17, 0, 5)).toBe(5)
    expect(minionSegmentDisplay(17, 5, 10)).toBe(10)
    expect(minionSegmentDisplay(17, 10, 15)).toBe(15)
    expect(minionSegmentDisplay(17, 15, 20)).toBe(17)
  })

  it('shows zeros for eliminated brackets after heavier damage (17→9)', () => {
    expect(minionSegmentDisplay(9, 0, 5)).toBe(5)
    expect(minionSegmentDisplay(9, 5, 10)).toBe(9)
    expect(minionSegmentDisplay(9, 10, 15)).toBe(0)
    expect(minionSegmentDisplay(9, 15, 20)).toBe(0)
  })
})

describe('rosterCombatStats', () => {
  it('uses bestiary FS/speed/stability for a named creature', () => {
    const sb = lookupStatblock('Goblin Assassin')
    expect(sb).toBeDefined()
    const m = { name: 'Goblin Assassin 1' } as Monster
    const stats = rosterCombatStats(m)
    expect(stats.fs).toBe(sb!.free_strike)
    expect(stats.spd).toBe(sb!.speed)
    expect(stats.stab).toBe(sb!.stability)
  })

  it('resolves minion parent via first minion name', () => {
    const sb = lookupStatblock('Goblin Spinecleaver')
    const m = {
      name: 'Minions',
      minions: [{ name: 'Goblin Spinecleaver 1', initials: 'G', conditions: [], dead: false }],
    } as Monster
    const stats = rosterCombatStats(m)
    expect(stats.spd).toBe(sb!.speed)
  })

  it('falls back to encounter fields when not in bestiary', () => {
    const m = {
      name: 'Custom',
      fs: 2,
      dist: 4,
      stab: 1,
    } as Monster
    expect(rosterCombatStats(m)).toEqual({ fs: 2, spd: 4, stab: 1 })
  })
})

describe('suggestedDeadCount', () => {
  it('returns 0 when pool is full (current=20, interval=5, count=4)', () => {
    expect(suggestedDeadCount(20, 5, 4)).toBe(0)
  })

  it('returns count when pool is empty (current=0)', () => {
    expect(suggestedDeadCount(0, 5, 4)).toBe(4)
  })

  it('returns 2 when current=10 and thresholds are [5,10,15,20]', () => {
    expect(suggestedDeadCount(10, 5, 4)).toBe(2)
  })

  it('returns 3 when current=5 and thresholds are [5,10,15,20]', () => {
    expect(suggestedDeadCount(5, 5, 4)).toBe(3)
  })

  it('returns 1 when current=12 (between 10 and 15)', () => {
    expect(suggestedDeadCount(12, 5, 4)).toBe(1)
  })

  it('returns 0 for a single minion at full stamina', () => {
    expect(suggestedDeadCount(8, 8, 1)).toBe(0)
  })

  it('returns 1 for a single minion at 0 stamina', () => {
    expect(suggestedDeadCount(0, 8, 1)).toBe(1)
  })
})

describe('bestiarySubtitle', () => {
  it('builds subtitle from level and roles', () => {
    expect(bestiarySubtitle({ level: 2, roles: ['Solo', 'Commander'] } as BestiaryStatblock)).toBe('Level 2 · Solo · Commander')
  })

  it('omits level when undefined', () => {
    expect(bestiarySubtitle({ roles: ['Minion'] } as BestiaryStatblock)).toBe('Minion')
  })
})

describe('deriveInitials', () => {
  it('takes first letter of each word, max 3', () => {
    expect(deriveInitials('Goblin Assassin')).toBe('GA')
    expect(deriveInitials('Minotaur Sunderer')).toBe('MS')
  })

  it('caps at 3 letters for long names', () => {
    expect(deriveInitials('The Great Red Dragon')).toBe('TGR')
  })

  it('handles single-word names', () => {
    expect(deriveInitials('Troll')).toBe('T')
  })
})
