import { useState, type ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StatBlock } from './StatBlock'
import { MonsterRowCells } from './MonsterRowCells'
import { GroupSection } from './GroupSection'
import type {
  EncounterGroup,
  GroupColorId,
  MonsterCardDrawerState,
  MonsterCardDrawerView,
  MonsterFeature,
} from '../types'
import { monsterCardDrawerViewEquals } from '../types'

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

  it('renders Draw Steel glyphs in left margin when feature icon emoji maps', () => {
    render(<StatBlock features={[sampleAbility, sampleTrait]} monsterName="Test Monster" />)
    const glyphs = screen.getAllByTestId('stat-block-feature-glyph')
    expect(glyphs.map((el) => el.textContent).sort().join('')).toBe('*t')
    expect(screen.queryByTestId('stat-block-feature-fallback')).not.toBeInTheDocument()
  })

  it('keeps emoji in margin when there is no glyph mapping', () => {
    const skull: MonsterFeature = { ...sampleAbility, icon: '☠️' }
    render(<StatBlock features={[skull]} monsterName="Test Monster" />)
    expect(screen.getByTestId('stat-block-feature-fallback')).toHaveTextContent('☠️')
    expect(screen.queryByTestId('stat-block-feature-glyph')).not.toBeInTheDocument()
  })

  it('renders abilities and traits in one card without section titles', () => {
    render(<StatBlock features={[sampleAbility, sampleTrait]} monsterName="Test Monster" />)
    expect(screen.queryByText('Abilities')).not.toBeInTheDocument()
    expect(screen.queryByText('Traits')).not.toBeInTheDocument()
    expect(screen.getByText('Sword Stab')).toBeInTheDocument()
    expect(screen.getByText('Crafty')).toBeInTheDocument()
  })

  it('renders power roll tiers', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText('Power Roll + 2')).toBeInTheDocument()
    expect(screen.getByText('4 damage')).toBeInTheDocument()
    expect(screen.getByText('6 damage')).toBeInTheDocument()
    expect(screen.getByText('7 damage')).toBeInTheDocument()
  })

  it('does not render tier range pills (glyph + aria carry threshold)', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.queryByText('≤11')).not.toBeInTheDocument()
    expect(screen.queryByText('12–16')).not.toBeInTheDocument()
    expect(screen.queryByText('17+')).not.toBeInTheDocument()
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
    expect(screen.getByText('Melee')).toBeInTheDocument()
    expect(screen.getByText('Strike')).toBeInTheDocument()
    expect(screen.getByText('Weapon')).toBeInTheDocument()
    expect(screen.getByText(/Main action/)).toBeInTheDocument()
    expect(screen.getByText(/Melee 1/)).toBeInTheDocument()
    expect(screen.getByText(/One creature or object/)).toBeInTheDocument()
    expect(screen.getByText('+ 2')).toBeInTheDocument()
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

  it('renders only abilities when no traits', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByText('Sword Stab')).toBeInTheDocument()
    expect(screen.queryByText('Crafty')).not.toBeInTheDocument()
  })

  it('renders only traits when no abilities', () => {
    render(<StatBlock features={[sampleTrait]} monsterName="Test Monster" />)
    expect(screen.getByText('Crafty')).toBeInTheDocument()
    expect(screen.queryByText('Sword Stab')).not.toBeInTheDocument()
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
    const nums = screen.getAllByTestId('draw-steel-marip-num')
    expect(nums.map((n) => n.textContent).join(' ')).toBe('-2 +2 0 0 -2')
  })

  it('renders speed and movement on separate lines', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    const header = screen.getByTestId('core-stats-header')
    expect(header.textContent).toMatch(/Speed/)
    expect(header.textContent).toMatch(/Movement:\s*Climb/)
    expect(header.textContent).not.toMatch(/\(\s*Climb\s*\)/)
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
    expect(screen.getByText(/With Captain:/)).toBeInTheDocument()
  })

  it('renders immunities and weaknesses when present', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Lich" />)
    expect(screen.getByText(/Immunity:/)).toBeInTheDocument()
    expect(screen.getByText('Corruption 10, poison 10')).toBeInTheDocument()
    expect(screen.getByText(/Weakness:/)).toBeInTheDocument()
    expect(screen.getByText('Holy 5')).toBeInTheDocument()
  })

  it('renders immunity and weakness lines with em dash when empty', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    const header = screen.getByTestId('core-stats-header')
    expect(header.textContent).toMatch(/Immunity:\s*—/)
    expect(header.textContent).toMatch(/Weakness:\s*—/)
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

describe('StatBlock Draw Steel glyphs (STAT-002)', () => {
  it('renders tier band glyphs with threshold in aria-label', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    const glyphs = screen.getAllByTestId('draw-steel-tier-glyph')
    expect(glyphs).toHaveLength(3)
    expect(glyphs[0]).toHaveAttribute('aria-label', 'Tier 1 (≤11)')
    expect(glyphs[1]).toHaveAttribute('aria-label', 'Tier 2 (12–16)')
    expect(glyphs[2]).toHaveAttribute('aria-label', 'Tier 3 (17+)')
    expect(glyphs[0].textContent).toBe('!')
    expect(glyphs[1].textContent).toBe('@')
    expect(glyphs[2].textContent).toBe('#')
  })

  it('renders attack keywords as plain words, not symbol glyphs', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.queryByTestId('draw-steel-keyword-glyph')).not.toBeInTheDocument()
    expect(screen.getByText('Melee')).toBeInTheDocument()
    expect(screen.getByText('Strike')).toBeInTheDocument()
    expect(screen.getByText('Weapon')).toBeInTheDocument()
  })

  it('exposes five MARIP letter slots for bestiary monsters', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Goblin Assassin" />)
    expect(screen.getAllByTestId('draw-steel-marip-letter')).toHaveLength(5)
  })

  it('stat block root is marked for layout tests', () => {
    render(<StatBlock features={[sampleAbility]} monsterName="Test Monster" />)
    expect(screen.getByTestId('stat-block-root')).toBeInTheDocument()
  })
})

describe('MonsterRowCells stat card name control', () => {
  const baseProps = {
    row: 1,
    ordinal: 1,
    monsterIndex: 0,
    totalCreatures: 1,
    groupKey: 'g0',
    groupNumber: 1,
    groupColor: 'red' as const,
    colorMenuOpen: false,
    colorMenuMonsterIndex: null as number | null,
    onGroupColorOrdinalClick: vi.fn(),
    turnComplete: false,
    seActPhaseGlow: false,
    onStaminaChange: vi.fn(),
    onConditionRemove: vi.fn(),
    onConditionAddOrSet: vi.fn(),
  }

  it('shows stat card trigger on name when monster has features', () => {
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
          monsterCardDrawerOpen={false}
          onMonsterCardNameClick={vi.fn()}
        />
      </div>,
    )
    expect(screen.getByRole('button', { name: /^Stat card for Goblin$/i })).toBeInTheDocument()
  })

  it('keeps plain name text when monster has no features', () => {
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
        />
      </div>,
    )
    expect(screen.queryByRole('button', { name: /^Stat card for Goblin$/i })).not.toBeInTheDocument()
    expect(screen.getByText('Goblin')).toBeInTheDocument()
  })

  it('calls onMonsterCardNameClick when name control is activated', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
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
          monsterCardDrawerOpen={false}
          onMonsterCardNameClick={onClick}
        />
      </div>,
    )
    await user.click(screen.getByRole('button', { name: /^Stat card for Goblin$/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('sets aria-expanded on name control from drawer open state', () => {
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
          monsterCardDrawerOpen={true}
          onMonsterCardNameClick={vi.fn()}
        />
      </div>,
    )
    const btn = screen.getByRole('button', { name: /^Stat card for Goblin$/i })
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveAttribute('aria-controls', 'monster-stat-card-drawer')
  })
})

describe('Malice creatures stat card name control', () => {
  const rowProps = {
    row: 1,
    ordinal: 1,
    monsterIndex: 0,
    totalCreatures: 1,
    groupKey: 'g0',
    groupNumber: 1,
    groupColor: 'red' as const,
    colorMenuOpen: false,
    colorMenuMonsterIndex: null as number | null,
    onGroupColorOrdinalClick: vi.fn(),
    turnComplete: false,
    seActPhaseGlow: false,
    onStaminaChange: vi.fn(),
    onConditionRemove: vi.fn(),
    onConditionAddOrSet: vi.fn(),
  }

  it('shows stat card trigger on name for a malice creature with features in MonsterRowCells', () => {
    render(
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
        <MonsterRowCells
          monster={{
            name: 'Goblin Assassin 1',
            subtitle: 'L1 Horde · Ambusher',
            initials: 'GA',
            stamina: [5, 15],
            marip: [-2, 2, 0, 0, -2],
            fs: -1,
            dist: 4,
            stab: 0,
            conditions: [],
            features: [sampleAbility],
          }}
          {...rowProps}
          monsterCardDrawerOpen={false}
          onMonsterCardNameClick={vi.fn()}
        />
      </div>,
    )
    expect(
      screen.getByRole('button', { name: /^Stat card for Goblin Assassin 1$/i }),
    ).toBeInTheDocument()
  })
})

function GroupSectionWithDrawerHarness(
  props: Omit<ComponentProps<typeof GroupSection>, 'monsterCardDrawer' | 'onToggleMonsterCard'>,
) {
  const [drawer, setDrawer] = useState<MonsterCardDrawerState | null>(null)
  const { group, thisGroupIndex, ...rest } = props
  const toggle = (monsterIndex: number, view: MonsterCardDrawerView) => {
    const m = group.monsters[monsterIndex]
    if (!m || (m.features?.length ?? 0) === 0) return
    if (view.kind === 'minion') {
      if (!m.minions || view.slot < 0 || view.slot >= m.minions.length) return
    }
    if (view.kind === 'minionParent' && (!m.minions || m.minions.length === 0)) return
    setDrawer((prev) => {
      if (
        prev != null &&
        prev.groupIndex === thisGroupIndex &&
        prev.monsterIndex === monsterIndex &&
        monsterCardDrawerViewEquals(prev.view, view)
      ) {
        return null
      }
      return { groupIndex: thisGroupIndex, monsterIndex, view }
    })
  }
  const openMonster =
    drawer != null ? group.monsters[drawer.monsterIndex] : undefined
  return (
    <div className="flex font-serif">
      <GroupSection
        {...rest}
        group={group}
        thisGroupIndex={thisGroupIndex}
        monsterCardDrawer={drawer}
        onToggleMonsterCard={toggle}
      />
      <aside
        id="monster-stat-card-drawer"
        className="sticky top-4 z-10 flex h-[calc(100svh-2rem)] w-80 shrink-0 flex-col self-start overflow-hidden"
      >
        {openMonster && (openMonster.features?.length ?? 0) > 0 && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <StatBlock features={openMonster.features!} monsterName={openMonster.name} />
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

describe('GroupSection stat card drawer integration', () => {
  function makeGroupWithFeatures(): EncounterGroup {
    return {
      id: 'statblock-features-g',
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
    seActPhaseGlow: false,
    onToggleTurn: vi.fn(),
    turnAriaLabel: 'Encounter group 1: turn pending',
    onGroupColorChange: vi.fn(),
    onMonsterStaminaChange: vi.fn(),
    onMonsterConditionRemove: vi.fn(),
    onMonsterConditionAddOrSet: vi.fn(),
  }

  it('toggles stat card in harness when clicking creature name with features', async () => {
    const user = userEvent.setup()
    const group = makeGroupWithFeatures()
    render(<GroupSectionWithDrawerHarness group={group} {...groupBaseProps} />)

    expect(screen.queryByRole('region', { name: /Stat block for Goblin A/i })).not.toBeInTheDocument()

    const nameBtn = screen.getByRole('button', { name: /^Stat card for Goblin A$/i })
    await user.click(nameBtn)

    expect(screen.getByRole('region', { name: /Stat block for Goblin A/i })).toBeInTheDocument()
    expect(screen.getByText('Sword Stab')).toBeInTheDocument()
    expect(screen.getByText('Crafty')).toBeInTheDocument()

    await user.click(nameBtn)

    expect(screen.queryByRole('region', { name: /Stat block for Goblin A/i })).not.toBeInTheDocument()
  })

  it('does not expose stat card name control for monster without features', () => {
    const group = makeGroupWithFeatures()
    render(<GroupSectionWithDrawerHarness group={group} {...groupBaseProps} />)
    expect(screen.queryByRole('button', { name: /^Stat card for Goblin B$/i })).not.toBeInTheDocument()
  })

  it('opens stat card for minion group parent via name', async () => {
    const user = userEvent.setup()
    const group: EncounterGroup = {
      id: 'statblock-minion-g',
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
            { name: 'Minion 1', initials: 'M1', conditions: [], dead: false },
            { name: 'Minion 2', initials: 'M2', conditions: [], dead: false },
          ],
        },
      ],
    }
    render(
      <GroupSectionWithDrawerHarness
        group={group}
        {...groupBaseProps}
        encounterGroupColors={['blue']}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Stat card for Minions$/i }))

    expect(screen.getByRole('region', { name: /Stat block for Minions/i })).toBeInTheDocument()
  })

  it('opens stat card for minion child via name on the horde', async () => {
    const user = userEvent.setup()
    const group: EncounterGroup = {
      id: 'statblock-minion-child-g',
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
            { name: 'Minion 1', initials: 'M1', conditions: [], dead: false },
            { name: 'Minion 2', initials: 'M2', conditions: [], dead: false },
          ],
        },
      ],
    }
    render(
      <GroupSectionWithDrawerHarness
        group={group}
        {...groupBaseProps}
        encounterGroupColors={['blue']}
      />,
    )

    await user.click(screen.getByRole('button', { name: /^Stat card for Minion 2$/i }))

    expect(screen.getByRole('region', { name: /Stat block for Minions/i })).toBeInTheDocument()
  })
})
