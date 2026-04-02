import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EditableStaminaCell } from './EditableStaminaCell'

describe('EditableStaminaCell', () => {
  it('displays current / max stamina text', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
  })

  it('shows a dash for 0/0 stamina', () => {
    render(<EditableStaminaCell current={0} max={0} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders a healthy heart glyph when stamina is above half', () => {
    render(<EditableStaminaCell current={10} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const group = screen.getByRole('group', { name: 'Edit stamina' })
    const hearts = within(group).getAllByRole('img', { name: /Healthy/i })
    expect(hearts.length).toBe(2)
  })

  it('styles stamina readout chip when healthy (no fill)', () => {
    render(<EditableStaminaCell current={10} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const el = screen.getByText('10 / 15')
    expect(el.className).toMatch(/text-zinc-800/)
    expect(el.className).not.toMatch(/bg-amber/)
    expect(el.className).not.toMatch(/bg-red/)
  })

  it('styles stamina readout with amber chip when winded', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const el = screen.getByText('5 / 15')
    expect(el.className).toMatch(/bg-amber-100\/90/)
    expect(el.className).toMatch(/text-amber-800/)
  })

  it('styles stamina readout with red chip at zero stamina', () => {
    render(<EditableStaminaCell current={0} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const el = screen.getByText('0 / 15')
    expect(el.className).toMatch(/bg-red-100\/90/)
    expect(el.className).toMatch(/text-red-700/)
    expect(el.className).toMatch(/line-through/)
  })

  it('renders a winded heart when stamina is at or below half', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const group = screen.getByRole('group', { name: 'Edit stamina' })
    const hearts = within(group).getAllByRole('img', { name: /Winded/i })
    expect(hearts.length).toBe(2)
  })

  it('renders a skull when stamina is 0', () => {
    render(<EditableStaminaCell current={0} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const group = screen.getByRole('group', { name: 'Edit stamina' })
    const skulls = within(group).getAllByRole('img', { name: /Dead/i })
    expect(skulls.length).toBe(2)
  })

  it('does not render any glyph for 0/0 stamina', () => {
    render(<EditableStaminaCell current={0} max={0} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const group = screen.getByRole('group', { name: 'Edit stamina' })
    expect(within(group).queryByRole('img', { name: /Healthy|Winded|Dead/i })).toBeNull()
  })

  it('has +1, +10, -1, -10 bump buttons', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const group = screen.getByRole('group', { name: 'Edit stamina' })
    expect(within(group).getByRole('button', { name: 'Increase stamina by 1' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Increase stamina by 10' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Decrease stamina by 1' })).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Decrease stamina by 10' })).toBeInTheDocument()
  })

  it('calls onChange with bumped value on +1 click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableStaminaCell current={5} max={15} onChange={onChange} ariaLabel="Edit stamina" />)
    await user.click(screen.getByRole('button', { name: 'Increase stamina by 1' }))
    expect(onChange).toHaveBeenCalledWith([6, 15])
  })

  it('calls onChange with bumped value on -1 click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableStaminaCell current={5} max={15} onChange={onChange} ariaLabel="Edit stamina" />)
    await user.click(screen.getByRole('button', { name: 'Decrease stamina by 1' }))
    expect(onChange).toHaveBeenCalledWith([4, 15])
  })

  it('calls onChange with +10 clamped at max', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableStaminaCell current={10} max={15} onChange={onChange} ariaLabel="Edit stamina" />)
    await user.click(screen.getByRole('button', { name: 'Increase stamina by 10' }))
    expect(onChange).toHaveBeenCalledWith([15, 15])
  })

  it('calls onChange with -10 clamped at 0', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableStaminaCell current={3} max={15} onChange={onChange} ariaLabel="Edit stamina" />)
    await user.click(screen.getByRole('button', { name: 'Decrease stamina by 10' }))
    expect(onChange).toHaveBeenCalledWith([0, 15])
  })

  it('has a dialog for the editor overlay', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    expect(screen.getByRole('dialog', { name: /Edit stamina — adjust values/i })).toBeInTheDocument()
  })

  it('editor overlay starts with opacity-0', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    const dialog = screen.getByRole('dialog', { name: /Edit stamina — adjust values/i })
    expect(dialog).toHaveClass('opacity-0')
  })

  it('has current and max stamina input fields', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    expect(screen.getByLabelText('Current stamina')).toBeInTheDocument()
    expect(screen.getByLabelText('Max stamina')).toBeInTheDocument()
  })

  it('renders input fields with the right initial values', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina" />)
    expect(screen.getByLabelText('Current stamina')).toHaveValue(5)
    expect(screen.getByLabelText('Max stamina')).toHaveValue(15)
  })

  it('calls onChange with normalized values on blur of current field', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableStaminaCell current={5} max={15} onChange={onChange} ariaLabel="Edit stamina" />)
    const curInput = screen.getByLabelText('Current stamina')
    await user.clear(curInput)
    await user.type(curInput, '12')
    await user.tab()
    expect(onChange).toHaveBeenCalledWith([12, 15])
  })

  it('reverts to current value on blur if input is invalid', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditableStaminaCell current={5} max={15} onChange={onChange} ariaLabel="Edit stamina" />)
    const curInput = screen.getByLabelText('Current stamina')
    await user.clear(curInput)
    await user.type(curInput, 'abc')
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(curInput).toHaveValue(5)
  })

  it('sets the right aria-label on the group', () => {
    render(<EditableStaminaCell current={5} max={15} onChange={vi.fn()} ariaLabel="Edit stamina for Goblin" />)
    expect(screen.getByRole('group', { name: 'Edit stamina for Goblin' })).toBeInTheDocument()
  })
})
