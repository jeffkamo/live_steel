import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TerrainRow } from './TerrainRow'
import type { TerrainRowState } from '../types'

function makeRow(overrides: Partial<TerrainRowState> = {}): TerrainRowState {
  return {
    object: 'Toppled barricade — light cover.',
    stamina: [6, 8],
    note: 'Burning; end of round.',
    conditions: [{ label: 'Slowed', state: 'neutral' }],
    ...overrides,
  }
}

describe('TerrainRow', () => {
  it('renders the terrain object description', () => {
    render(<TerrainRow row={makeRow()} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('Toppled barricade — light cover.')).toBeInTheDocument()
  })

  it('renders the terrain note', () => {
    render(<TerrainRow row={makeRow()} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('Burning; end of round.')).toBeInTheDocument()
  })

  it('renders stamina as current / max', () => {
    render(<TerrainRow row={makeRow()} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('6 / 8')).toBeInTheDocument()
  })

  it('renders a dash for 0/0 stamina', () => {
    render(<TerrainRow row={makeRow({ stamina: [0, 0] })} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders condition icons as non-interactive (span, not button)', () => {
    render(<TerrainRow row={makeRow()} onStaminaChange={vi.fn()} />)
    const slowedIcon = screen.getByTitle('Slowed (neutral)')
    expect(slowedIcon.tagName.toLowerCase()).toBe('span')
    expect(slowedIcon.closest('button')).toBeNull()
  })

  it('renders stamina editor with truncated aria-label', () => {
    const longObject = 'A'.repeat(60)
    render(<TerrainRow row={makeRow({ object: longObject })} onStaminaChange={vi.fn()} />)
    const label = `Edit stamina for terrain: ${longObject.slice(0, 48)}…`
    expect(screen.getByRole('group', { name: label })).toBeInTheDocument()
  })

  it('renders stamina editor with full name when short enough', () => {
    render(<TerrainRow row={makeRow({ object: 'Short name' })} onStaminaChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Edit stamina for terrain: Short name' })).toBeInTheDocument()
  })

  it('calls onStaminaChange when +1 button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TerrainRow row={makeRow()} onStaminaChange={onChange} />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for terrain: Toppled/i })
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(onChange).toHaveBeenCalledWith([7, 8])
  })

  it('calls onStaminaChange when -1 button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TerrainRow row={makeRow()} onStaminaChange={onChange} />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for terrain: Toppled/i })
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i }))
    expect(onChange).toHaveBeenCalledWith([5, 8])
  })

  it('renders multiple conditions', () => {
    const row = makeRow({
      conditions: [
        { label: 'Slowed', state: 'neutral' },
        { label: 'Weakened', state: 'eot' },
      ],
    })
    render(<TerrainRow row={row} onStaminaChange={vi.fn()} />)
    expect(screen.getByTitle('Slowed (neutral)')).toBeInTheDocument()
    expect(screen.getByTitle('Weakened (End of turn)')).toBeInTheDocument()
  })

  it('renders all 12 condition icons (active + inactive)', () => {
    render(<TerrainRow row={makeRow()} onStaminaChange={vi.fn()} />)
    const allIcons = screen.getAllByRole('img')
    const conditionIcons = allIcons.filter((el) =>
      el.title && !el.title.match(/Healthy|Winded|Dead/)
    )
    expect(conditionIcons.length).toBeGreaterThanOrEqual(12)
  })
})
