import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonsterRowCells } from './MonsterRowCells'
import type { Monster } from '../types'

function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    name: 'Test Goblin',
    subtitle: 'Level 1 Horde · Ambusher',
    initials: 'TG',
    stamina: [5, 15],
    marip: [-2, 2, 0, 0, -2],
    fs: -1,
    dist: 4,
    stab: 0,
    conditions: [{ label: 'Weakened', state: 'neutral' }],
    ...overrides,
  }
}

const baseProps = {
  row: 1,
  ordinal: 1,
  monsterIndex: 0,
  monsterCount: 2,
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

function renderRow(monster?: Monster, overrides = {}) {
  const m = monster ?? makeMonster()
  return render(
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)' }}>
      <MonsterRowCells monster={m} {...baseProps} {...overrides} />
    </div>,
  )
}

describe('MonsterRowCells', () => {
  it('renders monster name and subtitle', () => {
    renderRow()
    expect(screen.getByText('Test Goblin')).toBeInTheDocument()
    expect(screen.getByText('Level 1 Horde · Ambusher')).toBeInTheDocument()
  })

  it('renders ordinal badge button with correct aria-label', () => {
    renderRow()
    expect(
      screen.getByRole('button', {
        name: /^Encounter group 1: creature 1 of 2\. Group color Red\. Activate to change group color\.$/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders ordinal number in badge', () => {
    renderRow()
    const badge = screen.getByRole('button', { name: /creature 1 of 2/i })
    expect(badge).toHaveTextContent('1')
  })

  it('renders stamina display', () => {
    renderRow()
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
  })

  it('renders MARIP cluster', () => {
    renderRow()
    expect(screen.getByRole('group', { name: /Characteristics \(MARIP\)/i })).toBeInTheDocument()
  })

  it('renders MARIP values', () => {
    renderRow()
    const maripGroup = screen.getByRole('group', { name: /Characteristics \(MARIP\)/i })
    expect(within(maripGroup).getAllByText('-2').length).toBe(2)
    expect(within(maripGroup).getByText('2')).toBeInTheDocument()
  })

  it('renders stat cluster headers', () => {
    renderRow()
    expect(screen.getByTitle('Free strike')).toBeInTheDocument()
    expect(screen.getByTitle('Distance')).toBeInTheDocument()
    expect(screen.getByTitle('Stability')).toBeInTheDocument()
  })

  it('renders stat cluster values', () => {
    renderRow()
    expect(screen.getByText('-1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('renders condition cell', () => {
    renderRow()
    expect(screen.getByRole('group', { name: /^Conditions for Test Goblin/i })).toBeInTheDocument()
  })

  it('renders active condition icon', () => {
    renderRow()
    const condGroup = screen.getByRole('group', { name: /^Conditions for Test Goblin/i })
    expect(within(condGroup).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
  })

  it('calls onStaminaChange when stamina button is clicked', async () => {
    const user = userEvent.setup()
    const onStaminaChange = vi.fn()
    renderRow(undefined, { onStaminaChange })
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Test Goblin$/i })
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(onStaminaChange).toHaveBeenCalledWith([6, 15])
  })

  it('calls onGroupColorOrdinalClick when badge is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    renderRow(undefined, { onGroupColorOrdinalClick: onClick })
    await user.click(screen.getByRole('button', { name: /creature 1 of 2/i }))
    expect(onClick).toHaveBeenCalledWith(0, expect.any(HTMLElement))
  })

  it('sets aria-expanded on ordinal badge when color menu is open for this monster', () => {
    renderRow(undefined, { colorMenuOpen: true, colorMenuMonsterIndex: 0 })
    const badge = screen.getByRole('button', { name: /creature 1 of 2/i })
    expect(badge).toHaveAttribute('aria-expanded', 'true')
  })

  it('sets aria-expanded=false on ordinal badge when color menu is open for another monster', () => {
    renderRow(undefined, { colorMenuOpen: true, colorMenuMonsterIndex: 1 })
    const badge = screen.getByRole('button', { name: /creature 1 of 2/i })
    expect(badge).toHaveAttribute('aria-expanded', 'false')
  })

  it('applies reduced opacity when turnComplete is true', () => {
    renderRow(undefined, { turnComplete: true })
    const nameEl = screen.getByText('Test Goblin')
    const cell = nameEl.closest('[class*="opacity-"]')
    expect(cell?.className).toContain('opacity-[0.52]')
  })

  it('renders null marip as dashes', () => {
    renderRow(makeMonster({ marip: null }))
    const maripGroup = screen.getByRole('group', { name: /Characteristics \(MARIP\)/i })
    const dashes = within(maripGroup).getAllByText('—')
    expect(dashes.length).toBe(5)
  })

  it('renders 0/0 stamina as dash', () => {
    renderRow(makeMonster({ stamina: [0, 0] }))
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Test Goblin$/i })
    expect(within(staminaGroup).getByText('—')).toBeInTheDocument()
  })
})
