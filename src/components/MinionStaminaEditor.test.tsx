import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MinionStaminaEditor } from './MinionStaminaEditor'

describe('MinionStaminaEditor', () => {
  const baseProps = {
    current: 20,
    bump: vi.fn(),
    parentName: 'Minions',
    firstMinionName: 'Goblin Spinecleaver 1',
    minionCount: 4,
  }

  it('renders interval threshold segments for 4 minions', () => {
    render(<MinionStaminaEditor {...baseProps} />)
    const group = screen.getByRole('group', { name: /Minion stamina intervals/i })
    expect(within(group).getByTestId('editor-threshold-5')).toHaveTextContent('5')
    expect(within(group).getByTestId('editor-threshold-10')).toHaveTextContent('10')
    expect(within(group).getByTestId('editor-threshold-15')).toHaveTextContent('15')
    expect(within(group).getByTestId('editor-threshold-20')).toHaveTextContent('20')
  })

  it('renders separators between threshold segments', () => {
    render(<MinionStaminaEditor {...baseProps} />)
    const group = screen.getByRole('group', { name: /Minion stamina intervals/i })
    const separators = within(group).getAllByText('/')
    expect(separators).toHaveLength(3)
  })

  it('marks all thresholds healthy when current equals max', () => {
    render(<MinionStaminaEditor {...baseProps} current={20} />)
    for (const t of [5, 10, 15, 20]) {
      expect(screen.getByTestId(`editor-threshold-${t}`).className).not.toMatch(/line-through/)
      expect(screen.getByTestId(`editor-threshold-${t}`).className).toMatch(/text-zinc-950/)
    }
  })

  it('marks dead thresholds with line-through when stamina drops', () => {
    render(<MinionStaminaEditor {...baseProps} current={10} />)
    expect(screen.getByTestId('editor-threshold-5').className).not.toMatch(/line-through/)
    expect(screen.getByTestId('editor-threshold-10').className).not.toMatch(/line-through/)
    expect(screen.getByTestId('editor-threshold-15').className).toMatch(/line-through/)
    expect(screen.getByTestId('editor-threshold-20').className).toMatch(/line-through/)
  })

  it('shows at-risk styling for partially crossed intervals', () => {
    render(<MinionStaminaEditor {...baseProps} current={12} />)
    expect(screen.getByTestId('editor-threshold-5').className).toMatch(/text-zinc-950/)
    expect(screen.getByTestId('editor-threshold-10').className).toMatch(/text-zinc-950/)
    expect(screen.getByTestId('editor-threshold-15').className).toMatch(/text-amber-700/)
    expect(screen.getByTestId('editor-threshold-20').className).toMatch(/line-through/)
  })

  it('has +1, +10, -1, -10 bump buttons', () => {
    render(<MinionStaminaEditor {...baseProps} />)
    expect(screen.getByRole('button', { name: 'Increase stamina by 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase stamina by 10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decrease stamina by 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decrease stamina by 10' })).toBeInTheDocument()
  })

  it('calls bump with correct delta on +1 click', async () => {
    const user = userEvent.setup()
    const bump = vi.fn()
    render(<MinionStaminaEditor {...baseProps} bump={bump} />)
    await user.click(screen.getByRole('button', { name: 'Increase stamina by 1' }))
    expect(bump).toHaveBeenCalledWith(1)
  })

  it('calls bump with correct delta on -1 click', async () => {
    const user = userEvent.setup()
    const bump = vi.fn()
    render(<MinionStaminaEditor {...baseProps} bump={bump} />)
    await user.click(screen.getByRole('button', { name: 'Decrease stamina by 1' }))
    expect(bump).toHaveBeenCalledWith(-1)
  })

  it('calls bump with correct delta on +10 click', async () => {
    const user = userEvent.setup()
    const bump = vi.fn()
    render(<MinionStaminaEditor {...baseProps} bump={bump} />)
    await user.click(screen.getByRole('button', { name: 'Increase stamina by 10' }))
    expect(bump).toHaveBeenCalledWith(10)
  })

  it('calls bump with correct delta on -10 click', async () => {
    const user = userEvent.setup()
    const bump = vi.fn()
    render(<MinionStaminaEditor {...baseProps} bump={bump} />)
    await user.click(screen.getByRole('button', { name: 'Decrease stamina by 10' }))
    expect(bump).toHaveBeenCalledWith(-10)
  })

  it('dynamically adjusts segments when minionCount changes', () => {
    const { rerender } = render(<MinionStaminaEditor {...baseProps} minionCount={4} current={20} />)
    expect(screen.getByTestId('editor-threshold-20')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-threshold-25')).not.toBeInTheDocument()

    rerender(<MinionStaminaEditor {...baseProps} minionCount={5} current={25} />)
    expect(screen.getByTestId('editor-threshold-25')).toBeInTheDocument()
  })

  it('returns null when no bestiary entry is found', () => {
    const { container } = render(
      <MinionStaminaEditor
        current={10}
        bump={vi.fn()}
        parentName="Unknown Group"
        firstMinionName="Unknown Minion"
        minionCount={3}
      />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when minionCount is 0', () => {
    const { container } = render(
      <MinionStaminaEditor {...baseProps} minionCount={0} />,
    )
    expect(container.innerHTML).toBe('')
  })
})
