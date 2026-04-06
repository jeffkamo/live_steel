import { describe, expect, it } from 'vitest'
import {
  applyCaptainNumericToStatblock,
  captainHighlightsFromBonuses,
  parseWithCaptainEffect,
} from './withCaptainEffect'
import type { BestiaryStatblock } from './bestiary'

const sample: BestiaryStatblock = {
  name: 'X',
  roles: ['Minion'],
  ancestry: ['A'],
  ev: '1',
  stamina: '10',
  speed: 5,
  size: '1S',
  stability: 2,
  free_strike: 3,
  might: 0,
  agility: 0,
  reason: 0,
  intuition: 0,
  presence: 0,
}

describe('parseWithCaptainEffect', () => {
  it('parses speed bonus', () => {
    const p = parseWithCaptainEffect('+2 bonus to speed')
    expect(p.numeric.speed).toBe(2)
    expect(p.supplementalNotes).toEqual([])
  })

  it('parses stamina bonus', () => {
    const p = parseWithCaptainEffect('+3 bonus to Stamina')
    expect(p.numeric.stamina).toBe(3)
    expect(p.supplementalNotes).toEqual([])
  })

  it('parses damage bonus to strikes', () => {
    const p = parseWithCaptainEffect('+4 damage bonus to strikes')
    expect(p.numeric.freeStrike).toBe(4)
    expect(p.supplementalNotes).toEqual([])
  })

  it('parses bonus to strikes', () => {
    const p = parseWithCaptainEffect('+1 bonus to strikes')
    expect(p.numeric.freeStrike).toBe(1)
  })

  it('parses stability bonus', () => {
    const p = parseWithCaptainEffect('+2 bonus to stability')
    expect(p.numeric.stability).toBe(2)
  })

  it('treats edge and ranged rules as supplemental notes', () => {
    expect(parseWithCaptainEffect('Gain an edge on strikes').supplementalNotes).toEqual([
      'Gain an edge on strikes',
    ])
    expect(
      parseWithCaptainEffect('+5 bonus to ranged distance').supplementalNotes,
    ).toEqual(['+5 bonus to ranged distance'])
  })
})

describe('applyCaptainNumericToStatblock', () => {
  it('adds numeric bonuses to core fields', () => {
    const next = applyCaptainNumericToStatblock(sample, {
      speed: 1,
      stamina: 2,
      freeStrike: 1,
      stability: 1,
    })
    expect(next.speed).toBe(6)
    expect(next.stamina).toBe('12')
    expect(next.free_strike).toBe(4)
    expect(next.stability).toBe(3)
  })
})

describe('captainHighlightsFromBonuses', () => {
  it('flags non-zero bonuses', () => {
    expect(
      captainHighlightsFromBonuses({
        speed: 1,
        stamina: 0,
        freeStrike: 2,
        stability: 0,
      }),
    ).toEqual({
      speed: true,
      stamina: false,
      freeStrike: true,
      stability: false,
    })
  })
})
