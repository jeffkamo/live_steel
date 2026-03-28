import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreatureConditionCell } from './CreatureConditionCell'
import type { ConditionEntry } from '../types'

const baseProps = {
  monsterName: 'Test Monster',
  onRemove: vi.fn(),
  onAddOrSetCondition: vi.fn(),
  turnComplete: false,
}

function renderCell(conditions: ConditionEntry[] = [], overrides = {}) {
  const props = { ...baseProps, conditions, ...overrides }
  return render(<CreatureConditionCell {...props} />)
}

describe('CreatureConditionCell', () => {
  it('renders all 12 condition icons as interactive buttons', () => {
    renderCell()
    const group = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.length).toBe(12)
  })

  it('has correct aria-label with monster name', () => {
    renderCell()
    expect(screen.getByRole('group', { name: /^Conditions for Test Monster/i })).toBeInTheDocument()
  })

  it('starts with aria-expanded=false (picker closed)', () => {
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    expect(cell).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens picker dialog on Enter key', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })).toBeInTheDocument()
    expect(cell).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens picker dialog on Space key', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })).toBeInTheDocument()
  })

  it('closes picker on Escape key', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /^Add condition to Test Monster$/i })).toBeNull()
    expect(cell).toHaveAttribute('aria-expanded', 'false')
  })

  it('calls onRemove when clicking an active condition icon', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const conditions: ConditionEntry[] = [{ label: 'Bleeding', state: 'neutral' }]
    renderCell(conditions, { onRemove })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    await user.click(within(cell).getByRole('button', { name: /^Remove Bleeding$/i }))
    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('calls onAddOrSetCondition when clicking an inactive condition icon', async () => {
    const user = userEvent.setup()
    const onAddOrSet = vi.fn()
    renderCell([], { onAddOrSetCondition: onAddOrSet })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    await user.click(within(cell).getByRole('button', { name: /^Add Bleeding$/i }))
    expect(onAddOrSet).toHaveBeenCalledWith('Bleeding', 'neutral')
  })

  it('picker lists all 12 conditions with name buttons', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    expect(within(picker).getByRole('button', { name: /^Bleeding$/i })).toBeInTheDocument()
    expect(within(picker).getByRole('button', { name: /^Weakened$/i })).toBeInTheDocument()
  })

  it('picker has EoT and SE duration buttons for each condition', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    expect(within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Test Monster$/i })).toBeInTheDocument()
    expect(within(picker).getByRole('button', { name: /^Add Bleeding as save ends on Test Monster$/i })).toBeInTheDocument()
  })

  it('calls onAddOrSetCondition with neutral when clicking name in picker', async () => {
    const user = userEvent.setup()
    const onAddOrSet = vi.fn()
    renderCell([], { onAddOrSetCondition: onAddOrSet })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    await user.click(within(picker).getByRole('button', { name: /^Bleeding$/i }))
    expect(onAddOrSet).toHaveBeenCalledWith('Bleeding', 'neutral')
  })

  it('calls onAddOrSetCondition with eot when clicking EoT button', async () => {
    const user = userEvent.setup()
    const onAddOrSet = vi.fn()
    renderCell([], { onAddOrSetCondition: onAddOrSet })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    await user.click(within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Test Monster$/i }))
    expect(onAddOrSet).toHaveBeenCalledWith('Bleeding', 'eot')
  })

  it('calls onAddOrSetCondition with se when clicking SE button', async () => {
    const user = userEvent.setup()
    const onAddOrSet = vi.fn()
    renderCell([], { onAddOrSetCondition: onAddOrSet })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    await user.click(within(picker).getByRole('button', { name: /^Add Bleeding as save ends on Test Monster$/i }))
    expect(onAddOrSet).toHaveBeenCalledWith('Bleeding', 'se')
  })

  it('keeps picker open after selecting a condition name', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    await user.click(within(picker).getByRole('button', { name: /^Bleeding$/i }))
    expect(screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })).toBeInTheDocument()
  })

  it('keeps picker open after selecting EoT duration', async () => {
    const user = userEvent.setup()
    renderCell()
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    await user.click(within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Test Monster$/i }))
    expect(screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })).toBeInTheDocument()
  })

  it('highlights active EoT duration pill with amber styling', async () => {
    const user = userEvent.setup()
    const conditions: ConditionEntry[] = [{ label: 'Bleeding', state: 'eot' }]
    renderCell(conditions)
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    const eotBtn = within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Test Monster$/i })
    expect(eotBtn.className).toContain('amber')
  })

  it('dims inactive condition rows and keeps active ones normal in picker', async () => {
    const user = userEvent.setup()
    const conditions: ConditionEntry[] = [{ label: 'Bleeding', state: 'neutral' }]
    renderCell(conditions)
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    cell.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Test Monster$/i })
    const bleedingBtn = within(picker).getByRole('button', { name: /^Bleeding$/i })
    const activeRow = bleedingBtn.closest('[class*="opacity-50"]')
    expect(activeRow).toBeFalsy()

    const dazedBtn = within(picker).getByRole('button', { name: /^Dazed$/i })
    const inactiveRow = dazedBtn.closest('[class*="opacity-50"]')
    expect(inactiveRow).toBeTruthy()
  })

  it('applies reduced opacity when turnComplete is true', () => {
    renderCell([], { turnComplete: true })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    expect(cell.className).toContain('opacity-[0.52]')
  })

  it('applies full opacity when turnComplete is false', () => {
    renderCell([], { turnComplete: false })
    const cell = screen.getByRole('group', { name: /^Conditions for Test Monster/i })
    expect(cell.className).toContain('opacity-100')
  })
})
