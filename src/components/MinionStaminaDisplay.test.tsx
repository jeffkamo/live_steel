import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Monster } from '../types'
import { MinionStaminaDisplay } from './MinionStaminaDisplay'

const goblinMinionParent: Monster = {
  name: 'Minions',
  subtitle: '',
  initials: 'M',
  stamina: [20, 20],
  marip: null,
  fs: 0,
  dist: 0,
  stab: 0,
  conditions: [],
  minions: [{ name: 'Goblin Spinecleaver 1', initials: 'G', conditions: [], dead: false }],
}

describe('MinionStaminaDisplay', () => {
  it('renders interval thresholds for 4 minions', () => {
    render(
      <MinionStaminaDisplay
        current={20}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    const group = screen.getByRole('group', { name: /Minion stamina pool/i })
    expect(within(group).getByTestId('threshold-5')).toHaveTextContent('5')
    expect(within(group).getByTestId('threshold-10')).toHaveTextContent('10')
    expect(within(group).getByTestId('threshold-15')).toHaveTextContent('15')
    expect(within(group).getByTestId('threshold-20')).toHaveTextContent('20')
  })

  it('marks thresholds correctly at boundary (current=10, pool of 20)', () => {
    render(
      <MinionStaminaDisplay
        current={10}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.getByTestId('threshold-5')).toHaveTextContent('5')
    expect(screen.getByTestId('threshold-10')).toHaveTextContent('10')
    expect(screen.getByTestId('threshold-15')).toHaveTextContent('0')
    expect(screen.getByTestId('threshold-20')).toHaveTextContent('0')
    expect(screen.getByTestId('threshold-5').title).toMatch(/healthy/)
    expect(screen.getByTestId('threshold-10').title).toMatch(/healthy/)
    expect(screen.getByTestId('threshold-15').title).toMatch(/dead/)
    expect(screen.getByTestId('threshold-20').title).toMatch(/dead/)
  })

  it('shows at-risk when stamina is within an interval but not at its boundary', () => {
    render(
      <MinionStaminaDisplay
        current={12}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.getByTestId('threshold-5')).toHaveTextContent('5')
    expect(screen.getByTestId('threshold-10')).toHaveTextContent('10')
    expect(screen.getByTestId('threshold-15')).toHaveTextContent('12')
    expect(screen.getByTestId('threshold-20')).toHaveTextContent('0')
    expect(screen.getByTestId('threshold-5').title).toMatch(/healthy/)
    expect(screen.getByTestId('threshold-10').title).toMatch(/healthy/)
    expect(screen.getByTestId('threshold-15').title).toMatch(/at risk/)
    expect(screen.getByTestId('threshold-20').title).toMatch(/dead/)
  })

  it('all thresholds healthy when current equals max', () => {
    render(
      <MinionStaminaDisplay
        current={20}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    for (const t of [5, 10, 15, 20]) {
      expect(screen.getByTestId(`threshold-${t}`).title).toMatch(/healthy/)
    }
  })

  it('all thresholds dead when current is 0', () => {
    render(
      <MinionStaminaDisplay
        current={0}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    for (const t of [5, 10, 15, 20]) {
      expect(screen.getByTestId(`threshold-${t}`).title).toMatch(/dead/)
    }
  })

  it('shows at-risk for a partially crossed interval (current=7)', () => {
    render(
      <MinionStaminaDisplay
        current={7}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.getByTestId('threshold-5')).toHaveTextContent('5')
    expect(screen.getByTestId('threshold-10')).toHaveTextContent('7')
    expect(screen.getByTestId('threshold-15')).toHaveTextContent('0')
    expect(screen.getByTestId('threshold-20')).toHaveTextContent('0')
    expect(screen.getByTestId('threshold-5').title).toMatch(/healthy/)
    expect(screen.getByTestId('threshold-10').title).toMatch(/at risk/)
    expect(screen.getByTestId('threshold-15').title).toMatch(/dead/)
    expect(screen.getByTestId('threshold-20').title).toMatch(/dead/)
  })

  it('shows 5/10/15/17 after 3 damage from full pool', () => {
    render(
      <MinionStaminaDisplay
        current={17}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.getByTestId('threshold-5')).toHaveTextContent('5')
    expect(screen.getByTestId('threshold-10')).toHaveTextContent('10')
    expect(screen.getByTestId('threshold-15')).toHaveTextContent('15')
    expect(screen.getByTestId('threshold-20')).toHaveTextContent('17')
  })

  it('shows 5/9/0/0 after further damage into lower bracket', () => {
    render(
      <MinionStaminaDisplay
        current={9}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.getByTestId('threshold-5')).toHaveTextContent('5')
    expect(screen.getByTestId('threshold-10')).toHaveTextContent('9')
    expect(screen.getByTestId('threshold-15')).toHaveTextContent('0')
    expect(screen.getByTestId('threshold-20')).toHaveTextContent('0')
  })

  it('applies line-through styling to dead thresholds', () => {
    render(
      <MinionStaminaDisplay
        current={5}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.getByTestId('threshold-10').className).toMatch(/line-through/)
    expect(screen.getByTestId('threshold-15').className).toMatch(/line-through/)
    expect(screen.getByTestId('threshold-20').className).toMatch(/line-through/)
    expect(screen.getByTestId('threshold-5').className).not.toMatch(/line-through/)
  })

  it('falls back to standard display when no bestiary entry is found', () => {
    const unknownParent: Monster = {
      name: 'Unknown Group',
      subtitle: '',
      initials: 'U',
      stamina: [8, 12],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
      minions: [
        { name: 'a', initials: '1', conditions: [], dead: false },
        { name: 'b', initials: '2', conditions: [], dead: false },
        { name: 'c', initials: '3', conditions: [], dead: false },
      ],
    }
    render(
      <MinionStaminaDisplay
        current={8}
        max={12}
        parentMonster={unknownParent}
        minionCount={3}
      />,
    )
    expect(screen.queryByRole('group', { name: /Minion stamina pool/i })).not.toBeInTheDocument()
    expect(screen.getByText('8 / 12')).toBeInTheDocument()
  })

  it('falls back to standard display when minionCount is 0', () => {
    const solo: Monster = {
      name: 'Goblin Assassin',
      subtitle: '',
      initials: 'G',
      stamina: [5, 5],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
    }
    render(
      <MinionStaminaDisplay
        current={5}
        max={5}
        parentMonster={solo}
        minionCount={0}
      />,
    )
    expect(screen.queryByRole('group', { name: /Minion stamina pool/i })).not.toBeInTheDocument()
    expect(screen.getByText('5 / 5')).toBeInTheDocument()
  })

  it('renders separators between thresholds', () => {
    render(
      <MinionStaminaDisplay
        current={20}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    const group = screen.getByRole('group', { name: /Minion stamina pool/i })
    const separators = within(group).getAllByText('/')
    expect(separators).toHaveLength(3)
  })

  it('shows "Kill" cue when stamina suggests more dead than actually dead', () => {
    render(
      <MinionStaminaDisplay
        current={10}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
        actualDeadCount={0}
      />,
    )
    const cue = screen.getByTestId('threshold-mismatch-cue')
    expect(cue).toBeInTheDocument()
    expect(cue.textContent).toMatch(/Kill 2/)
    expect(cue.title).toMatch(/2 minions should be marked dead/)
  })

  it('shows "Kill 1" cue for single minion mismatch', () => {
    render(
      <MinionStaminaDisplay
        current={10}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
        actualDeadCount={1}
      />,
    )
    const cue = screen.getByTestId('threshold-mismatch-cue')
    expect(cue.textContent).toMatch(/Kill 1/)
    expect(cue.title).toMatch(/1 minion should be marked dead/)
  })

  it('shows "Revive" cue when more minions are dead than stamina suggests', () => {
    render(
      <MinionStaminaDisplay
        current={20}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
        actualDeadCount={2}
      />,
    )
    const cue = screen.getByTestId('threshold-mismatch-cue')
    expect(cue).toBeInTheDocument()
    expect(cue.textContent).toMatch(/Revive 2/)
    expect(cue.title).toMatch(/2 minions can be revived/)
  })

  it('shows no cue when actual dead matches suggested dead', () => {
    render(
      <MinionStaminaDisplay
        current={10}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
        actualDeadCount={2}
      />,
    )
    expect(screen.queryByTestId('threshold-mismatch-cue')).not.toBeInTheDocument()
  })

  it('shows no cue when actualDeadCount is omitted and pool is full', () => {
    render(
      <MinionStaminaDisplay
        current={20}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
      />,
    )
    expect(screen.queryByTestId('threshold-mismatch-cue')).not.toBeInTheDocument()
  })

  it('cue has animate-pulse class for subtle animation', () => {
    render(
      <MinionStaminaDisplay
        current={5}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
        actualDeadCount={0}
      />,
    )
    const cue = screen.getByTestId('threshold-mismatch-cue')
    expect(cue.className).toMatch(/animate-pulse/)
  })

  it('cue has role="status" for screen reader announcement', () => {
    render(
      <MinionStaminaDisplay
        current={5}
        max={20}
        parentMonster={goblinMinionParent}
        minionCount={4}
        actualDeadCount={0}
      />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
