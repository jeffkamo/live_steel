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
    ...overrides,
  }
}

describe('TerrainRow', () => {
  it('renders the terrain object description', () => {
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('Toppled barricade — light cover.')).toBeInTheDocument()
  })

  it('renders the terrain note', () => {
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('Burning; end of round.')).toBeInTheDocument()
  })

  it('renders stamina as current / max', () => {
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('6 / 8')).toBeInTheDocument()
  })

  it('renders a dash for 0/0 stamina', () => {
    render(<TerrainRow row={makeRow({ stamina: [0, 0] })} rowIndex={0} onStaminaChange={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders stamina editor with truncated aria-label', () => {
    const longObject = 'A'.repeat(60)
    render(<TerrainRow row={makeRow({ object: longObject })} rowIndex={0} onStaminaChange={vi.fn()} />)
    const label = `Edit stamina for terrain: ${longObject.slice(0, 48)}…`
    expect(screen.getByRole('group', { name: label })).toBeInTheDocument()
  })

  it('renders stamina editor with full name when short enough', () => {
    render(<TerrainRow row={makeRow({ object: 'Short name' })} rowIndex={0} onStaminaChange={vi.fn()} />)
    expect(screen.getByRole('group', { name: 'Edit stamina for terrain: Short name' })).toBeInTheDocument()
  })

  it('calls onStaminaChange when +1 button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={onChange} />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for terrain: Toppled/i })
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(onChange).toHaveBeenCalledWith([7, 8])
  })

  it('calls onStaminaChange when -1 button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={onChange} />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for terrain: Toppled/i })
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i }))
    expect(onChange).toHaveBeenCalledWith([5, 8])
  })

  it('renders delete button when not locked', () => {
    const onDelete = vi.fn()
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={vi.fn()} onDelete={onDelete} />)
    expect(screen.getByRole('button', { name: /^Delete terrain/i })).toBeInTheDocument()
  })

  it('does not render delete button when uiLocked', () => {
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={vi.fn()} uiLocked onDelete={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /^Delete terrain/i })).not.toBeInTheDocument()
  })

  it('renders object name as clickable when terrainName is set', () => {
    const onClick = vi.fn()
    render(
      <TerrainRow
        row={makeRow({ terrainName: 'Brambles' })}
        rowIndex={0}
        onStaminaChange={vi.fn()}
        onClick={onClick}
      />,
    )
    expect(screen.getByRole('button', { name: /^View stat block for/i })).toBeInTheDocument()
  })

  it('renders object name as plain text when no terrainName', () => {
    render(<TerrainRow row={makeRow()} rowIndex={0} onStaminaChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /^View stat block for/i })).not.toBeInTheDocument()
  })
})
