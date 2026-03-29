import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GroupSection } from './GroupSection'
import type { EncounterGroup, GroupColorId } from '../types'

function makeGroup(overrides: Partial<EncounterGroup> = {}): EncounterGroup {
  return {
    id: 'test-encounter-group',
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
        conditions: [{ label: 'Bleeding', state: 'neutral' }],
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
    ...overrides,
  }
}

const baseProps = {
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

function renderGroup(group?: EncounterGroup, overrides = {}) {
  const g = group ?? makeGroup()
  return render(<GroupSection group={g} {...baseProps} {...overrides} />)
}

describe('GroupSection', () => {
  it('renders all monsters in the group', () => {
    renderGroup()
    expect(screen.getByText('Goblin A')).toBeInTheDocument()
    expect(screen.getByText('Goblin B')).toBeInTheDocument()
  })

  it('renders the turn column', () => {
    renderGroup()
    expect(screen.getByRole('button', { name: 'Encounter group 1: turn pending' })).toBeInTheDocument()
  })

  it('forwards onToggleTurn to the turn column', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    renderGroup(undefined, { onToggleTurn: onToggle })
    await user.click(screen.getByRole('button', { name: 'Encounter group 1: turn pending' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('forwards turnActed state to the turn column', () => {
    renderGroup(undefined, { turnActed: true, turnAriaLabel: 'Encounter group 1: turn acted' })
    expect(screen.getByRole('button', { name: 'Encounter group 1: turn acted' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders ordinal badges with correct creature counts', () => {
    renderGroup()
    expect(screen.getByRole('button', { name: /creature 1 of 2/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creature 2 of 2/i })).toBeInTheDocument()
  })

  it('forwards onMonsterStaminaChange when stamina is edited', async () => {
    const user = userEvent.setup()
    const onStaminaChange = vi.fn()
    renderGroup(undefined, { onMonsterStaminaChange: onStaminaChange })
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin A$/i })
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(onStaminaChange).toHaveBeenCalledWith(0, [6, 15])
  })

  it('forwards onMonsterConditionRemove when condition is toggled off', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    renderGroup(undefined, { onMonsterConditionRemove: onRemove })
    const condGroup = screen.getByRole('group', { name: /^Conditions for Goblin A/i })
    await user.click(within(condGroup).getByRole('button', { name: /^Remove Bleeding$/i }))
    expect(onRemove).toHaveBeenCalledWith(0, 0)
  })

  it('forwards onMonsterConditionAddOrSet when condition is toggled on', async () => {
    const user = userEvent.setup()
    const onAddOrSet = vi.fn()
    renderGroup(undefined, { onMonsterConditionAddOrSet: onAddOrSet })
    const condGroup = screen.getByRole('group', { name: /^Conditions for Goblin B/i })
    await user.click(within(condGroup).getByRole('button', { name: /^Add Bleeding$/i }))
    expect(onAddOrSet).toHaveBeenCalledWith(1, 'Bleeding', 'neutral')
  })

  it('opens and closes the group color picker via ordinal badge', async () => {
    const user = userEvent.setup()
    renderGroup()
    const badge = screen.getByRole('button', { name: /creature 1 of 2/i })
    await user.click(badge)
    expect(badge).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: /^Choose color for encounter group 1$/i })).toBeInTheDocument()
    await user.click(badge)
    expect(badge).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders a single monster group correctly', () => {
    const single = makeGroup({
      monsters: [
        {
          name: 'Solo Boss',
          subtitle: 'Level 5 Solo',
          initials: 'SB',
          stamina: [30, 30],
          marip: [3, 1, 2, 0, 1],
          fs: 3,
          dist: 5,
          stab: 2,
          conditions: [],
        },
      ],
    })
    renderGroup(single)
    expect(screen.getByText('Solo Boss')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creature 1 of 1/i })).toBeInTheDocument()
  })
})
