import { describe, expect, it } from 'vitest'
import {
  baseName,
  lookupStatblock,
  statblockNames,
  statblockCount,
  mapFeatures,
  featuresForMonster,
  isMaliceCreature,
} from './bestiary'
import { cloneEncounterGroups } from './data'

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

  it('returns empty features for monsters not in bestiary without seed features', () => {
    const groups = cloneEncounterGroups()
    const reserve = groups[3]!.monsters[2]!
    expect(reserve.name).toBe('Reserve slot')
    expect(reserve.features).toEqual([])
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
