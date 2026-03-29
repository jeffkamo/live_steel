import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatBlock } from './StatBlock'
import { MonsterRowCells } from './MonsterRowCells'
import { GroupSection } from './GroupSection'
import type { EncounterGroup, GroupColorId, MonsterFeature } from '../types'

const sampleAbility: MonsterFeature = {
  type: 'feature',
  feature_type: 'ability',
  name: 'Sword Stab',
  icon: '🗡',
  ability_type: 'Signature Ability',
  keywords: ['Melee', 'Strike', 'Weapon'],
  usage: 'Main action',
  distance: 'Melee 1',
  target: 'One creature or object',
  effects: [
    { roll: 'Power Roll + 2', tier1: '4 damage', tier2: '6 damage', tier3: '7 damage' },
    { name: 'Effect', effect: 'Extra 2 damage on edge.' },
  ],
}

const sampleTrait: MonsterFeature = {
  type: 'feature',
  feature_type: 'trait',
  name: 'Crafty',
  icon: '⭐️',
  effects: [{ effect: "Doesn't provoke opportunity attacks by moving." }],
}

describe('StatBlock', () => {
  it('renders ability name and trait name', () => {
    render(<StatBlock features={[sampleAbility, sampleTrait]} monsterName="Test Monster" />)
    expect(screen.getByText('Sword Stab')).toBeInTheDocument()
    expect(screen.getByText('Crafty')).toBeInTheDocument()
  })

  it('renders section headers for abilities and traits', () => {
    render(<StatBlock features={[sampleAbility, sampleTrait]} monsterName="Test Monster" />)
    expect(screen.getByText('Abilities')).toBeInTheDocument()
    expect(screen.getByText('Traits')).toBeInTheDocument()
  })

  it('renders power roll tiers', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText('Power Roll + 2')).toBeInTheDocument()
    expect(screen.getByText('4 damage')).toBeInTheDocument()
    expect(screen.getByText('6 damage')).toBeInTheDocument()
    expect(screen.getByText('7 damage')).toBeInTheDocument()
  })

  it('renders tier labels', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText('11−')).toBeInTheDocument()
    expect(screen.getByText('12–16')).toBeInTheDocument()
    expect(screen.getByText('17+')).toBeInTheDocument()
  })

  it('renders effect text', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText(/Extra 2 damage on edge/)).toBeInTheDocument()
  })

  it('renders trait effect text', () => {
    render(<StatBlock features={[sampleTrait]} monsterName="Test Monster" />)
    expect(screen.getByText(/opportunity attacks/)).toBeInTheDocument()
  })

  it('renders keywords, usage, distance, target for abilities', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText(/Melee, Strike, Weapon/)).toBeInTheDocument()
    expect(screen.getByText(/Main action/)).toBeInTheDocument()
    expect(screen.getByText(/Melee 1/)).toBeInTheDocument()
    expect(screen.getByText(/One creature or object/)).toBeInTheDocument()
  })

  it('renders ability_type label', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText('Signature Ability')).toBeInTheDocument()
  })

  it('renders cost pill when present', () => {
    const withCost: MonsterFeature = {
      ...sampleAbility,
      name: 'Shadow Chains',
      cost: '3 Malice',
    }
    render(<StatBlock features={[withCost]} monsterName="Test Monster" />)
    expect(screen.getByText('3 Malice')).toBeInTheDocument()
  })

  it('renders empty message when no features', () => {
    render(<StatBlock features={[]} monsterName="Test Monster" />)
    expect(screen.getByText('No features available.')).toBeInTheDocument()
  })

  it('has an accessible region label', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin" />)
    expect(screen.getByRole('region', { name: 'Stat block for Goblin' })).toBeInTheDocument()
  })

  it('renders only abilities section when no traits', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText('Abilities')).toBeInTheDocument()
    expect(screen.queryByText('Traits')).not.toBeInTheDocument()
  })

  it('renders only traits section when no abilities', () => {
    render(<StatBlock features={[sampleTrait]} monsterName="Test Monster" />)
    expect(screen.queryByText('Abilities')).not.toBeInTheDocument()
    expect(screen.getByText('Traits')).toBeInTheDocument()
  })
})

describe('StatBlock core stats from bestiary', () => {
  it('renders default stamina from bestiary for Goblin Assassin', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getByTestId('core-stats-header')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders MARIP values from bestiary', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getByText('-2 / 2 / 0 / 0 / -2')).toBeInTheDocument()
  })

  it('renders speed and movement type', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getByText('6 (Climb)')).toBeInTheDocument()
  })

  it('renders size', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getByText('1S')).toBeInTheDocument()
  })

  it('renders stability and free strike', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    const header = screen.getByTestId('core-stats-header')
    expect(header).toHaveTextContent('Stability')
    expect(header).toHaveTextContent('Free Strike')
  })

  it('renders ancestry', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getByText('Goblin · Humanoid')).toBeInTheDocument()
  })

  it('renders EV', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getByText('EV 3')).toBeInTheDocument()
  })

  it('renders with_captain for minion statblocks', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Spinecleaver" />)
    expect(screen.getByText('+1 damage bonus to strikes')).toBeInTheDocument()
    expect(screen.getByText('With Captain')).toBeInTheDocument()
  })

  it('renders immunities and weaknesses when present', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Lich" />)
    expect(screen.getByText('Immunities')).toBeInTheDocument()
    expect(screen.getByText('Corruption 10, poison 10')).toBeInTheDocument()
    expect(screen.getByText('Weaknesses')).toBeInTheDocument()
    expect(screen.getByText('Holy 5')).toBeInTheDocument()
  })

  it('does not render core stats header for unknown monster', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.queryByTestId('core-stats-header')).not.toBeInTheDocument()
  })

  it('strips trailing ordinal to find bestiary entry', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin 1" />)
    expect(screen.getByTestId('core-stats-header')).toBeInTheDocument()
    expect(screen.getByText('Goblin · Humanoid')).toBeInTheDocument()
  })

  it('renders speed without movement type when not present', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Underboss" />)
    const header = screen.getByTestId('core-stats-header')
    expect(header).toHaveTextContent('Speed')
  })

  it('renders stat block with bestiary data even when no features', () => {
    render(<StatBlock features={[]} monsterName="Goblin Assassin" />)
    expect(screen.getByTestId('core-stats-header')).toBeInTheDocument()
    expect(screen.queryByTestId('stat-block-empty')).not.toBeInTheDocument()
  })

  it('shows empty message only when no features and no bestiary match', () => {
    render(<StatBlock features={[]} monsterName="Nonexistent Creature" />)
    expect(screen.queryByTestId('core-stats-header')).not.toBeInTheDocument()
    expect(screen.getByTestId('stat-block-empty')).toBeInTheDocument()
  })
})

describe('MonsterRowCells stat block toggle', () => {
  const baseProps = {
    row: 1,
    ordinal: 1,
    monsterIndex: 0,
    monsterCount: 1,
    groupKey: 'g0',
    groupNumber: 1,
    groupColor: 'red' as const,
    colorMenuOpen: false,
    colorMenuMonsterIndex: null as number | null,
    onGroupColorOrdinalClick: vi.fn(),
    turnComplete: false,
    onStaminaChange: vi.fn(),
    onConditionRemove: vi.fn(),
    onConditionAddOrSet: vi.fn(),
  }

  it('shows stat block toggle when monster has features', () => {
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin',
            subtitle: 'L1 Horde',
            initials: 'G',
            stamina: [5, 15],
            marip: [0, 0, 0, 0, 0],
            fs: 0,
            dist: 5,
            stab: 0,
            conditions: [],
            features: [sampleAbility],
          }}
          {...baseProps}
          statBlockExpanded={false}
          onToggleStatBlock={vi.fn()}
        />
      </div>,
    )
    expect(
      screen.getByRole('button', { name: /Expand stat block for Goblin/i }),
    ).toBeInTheDocument()
  })

  it('does not show stat block toggle when monster has no features', () => {
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin',
            subtitle: 'L1 Horde',
            initials: 'G',
            stamina: [5, 15],
            marip: [0, 0, 0, 0, 0],
            fs: 0,
            dist: 5,
            stab: 0,
            conditions: [],
          }}
          {...baseProps}
          statBlockExpanded={false}
          onToggleStatBlock={vi.fn()}
        />
      </div>,
    )
    expect(
      screen.queryByRole('button', { name: /stat block/i }),
    ).not.toBeInTheDocument()
  })

  it('calls onToggleStatBlock when toggle is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin',
            subtitle: 'L1 Horde',
            initials: 'G',
            stamina: [5, 15],
            marip: [0, 0, 0, 0, 0],
            fs: 0,
            dist: 5,
            stab: 0,
            conditions: [],
            features: [sampleAbility],
          }}
          {...baseProps}
          statBlockExpanded={false}
          onToggleStatBlock={onToggle}
        />
      </div>,
    )
    await user.click(screen.getByRole('button', { name: /Expand stat block for Goblin/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('renders stat block content when expanded', () => {
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin',
            subtitle: 'L1 Horde',
            initials: 'G',
            stamina: [5, 15],
            marip: [0, 0, 0, 0, 0],
            fs: 0,
            dist: 5,
            stab: 0,
            conditions: [],
            features: [sampleAbility, sampleTrait],
          }}
          {...baseProps}
          statBlockExpanded={true}
          onToggleStatBlock={vi.fn()}
        />
      </div>,
    )
    expect(screen.getByRole('region', { name: 'Stat block for Goblin' })).toBeInTheDocument()
    expect(screen.getByText('Sword Stab')).toBeInTheDocument()
    expect(screen.getByText('Crafty')).toBeInTheDocument()
  })

  it('does not render stat block content when collapsed', () => {
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin',
            subtitle: 'L1 Horde',
            initials: 'G',
            stamina: [5, 15],
            marip: [0, 0, 0, 0, 0],
            fs: 0,
            dist: 5,
            stab: 0,
            conditions: [],
            features: [sampleAbility, sampleTrait],
          }}
          {...baseProps}
          statBlockExpanded={false}
          onToggleStatBlock={vi.fn()}
        />
      </div>,
    )
    expect(screen.queryByRole('region', { name: /Stat block/i })).not.toBeInTheDocument()
  })

  it('shows aria-expanded=true on toggle when stat block is expanded', () => {
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin',
            subtitle: 'L1 Horde',
            initials: 'G',
            stamina: [5, 15],
            marip: [0, 0, 0, 0, 0],
            fs: 0,
            dist: 5,
            stab: 0,
            conditions: [],
            features: [sampleAbility],
          }}
          {...baseProps}
          statBlockExpanded={true}
          onToggleStatBlock={vi.fn()}
        />
      </div>,
    )
    const btn = screen.getByRole('button', { name: /Collapse stat block for Goblin/i })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('GroupSection stat block integration', () => {
  function makeGroupWithFeatures(): EncounterGroup {
    return {
      color: 'red',
      monsters: [
        {
          name: 'Goblin A',
          subtitle: 'Level 1 Horde',
          initials: 'GA',
          stamina: [5, 15],
          marip: [0, 1, 0, 0, 0],
          fs: 0,
          dist: 4,
          stab: 0,
          conditions: [],
          features: [sampleAbility, sampleTrait],
        },
        {
          name: 'Goblin B',
          subtitle: 'Level 1 Horde',
          initials: 'GB',
          stamina: [10, 10],
          marip: [1, 0, 0, 0, 1],
          fs: 1,
          dist: 5,
          stab: 1,
          conditions: [],
        },
      ],
    }
  }

  const groupBaseProps = {
    groupKey: 'g0',
    groupNumber: 1,
    thisGroupIndex: 0,
    encounterGroupColors: ['red', 'blue'] as GroupColorId[],
    turnActed: false,
    onToggleTurn: vi.fn(),
    turnAriaLabel: 'Encounter group 1: turn pending',
    onGroupColorChange: vi.fn(),
    onMonsterStaminaChange: vi.fn(),
    onMonsterConditionRemove: vi.fn(),
    onMonsterConditionAddOrSet: vi.fn(),
  }

  it('toggles stat block expand/collapse on monster with features', async () => {
    const user = userEvent.setup()
    const group = makeGroupWithFeatures()
    render(<GroupSection group={group} {...groupBaseProps} />)

    expect(screen.queryByRole('region', { name: /Stat block for Goblin A/i })).not.toBeInTheDocument()

    const expandBtn = screen.getByRole('button', { name: /Expand stat block for Goblin A/i })
    await user.click(expandBtn)

    expect(screen.getByRole('region', { name: /Stat block for Goblin A/i })).toBeInTheDocument()
    expect(screen.getByText('Sword Stab')).toBeInTheDocument()
    expect(screen.getByText('Crafty')).toBeInTheDocument()

    const collapseBtn = screen.getByRole('button', { name: /Collapse stat block for Goblin A/i })
    await user.click(collapseBtn)

    expect(screen.queryByRole('region', { name: /Stat block for Goblin A/i })).not.toBeInTheDocument()
  })

  it('does not show stat block toggle for monster without features', () => {
    const group = makeGroupWithFeatures()
    render(<GroupSection group={group} {...groupBaseProps} />)
    expect(screen.queryByRole('button', { name: /stat block for Goblin B/i })).not.toBeInTheDocument()
  })

  it('renders stat block for minion group parent row', async () => {
    const user = userEvent.setup()
    const group: EncounterGroup = {
      color: 'blue',
      monsters: [
        {
          name: 'Minions',
          subtitle: 'Horde',
          initials: 'M',
          stamina: [12, 12],
          marip: [0, 0, 0, 0, 0],
          fs: 0,
          dist: 3,
          stab: 0,
          conditions: [],
          features: [sampleAbility],
          minions: [
            { name: 'Minion 1', initials: 'M1', conditions: [] },
            { name: 'Minion 2', initials: 'M2', conditions: [] },
          ],
        },
      ],
    }
    render(
      <GroupSection
        group={group}
        {...groupBaseProps}
        encounterGroupColors={['blue']}
      />,
    )

    const expandStatBtn = screen.getByRole('button', { name: /Expand stat block for Minions/i })
    await user.click(expandStatBtn)

    expect(screen.getByRole('region', { name: /Stat block for Minions/i })).toBeInTheDocument()
  })
})
