import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TurnColumnCell, GroupTurnColumn } from './TurnColumnCell'

describe('TurnColumnCell', () => {
  it('renders a button with the given label', () => {
    render(<TurnColumnCell acted={false} onToggle={vi.fn()} label="Group 1: turn pending" />)
    expect(screen.getByRole('button', { name: 'Group 1: turn pending' })).toBeInTheDocument()
  })

  it('shows aria-pressed=false when not acted', () => {
    render(<TurnColumnCell acted={false} onToggle={vi.fn()} label="turn pending" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows aria-pressed=true when acted', () => {
    render(<TurnColumnCell acted={true} onToggle={vi.fn()} label="turn acted" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<TurnColumnCell acted={false} onToggle={onToggle} label="toggle" />)
    await user.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('renders "Turn" text', () => {
    render(<TurnColumnCell acted={false} onToggle={vi.fn()} label="label" />)
    expect(screen.getByText('Turn')).toBeInTheDocument()
  })

  it('applies opacity-[0.52] when acted', () => {
    render(<TurnColumnCell acted={true} onToggle={vi.fn()} label="label" />)
    expect(screen.getByRole('button').className).toContain('opacity-[0.52]')
  })

  it('applies opacity-100 when not acted', () => {
    render(<TurnColumnCell acted={false} onToggle={vi.fn()} label="label" />)
    expect(screen.getByRole('button').className).toContain('opacity-100')
  })
})

describe('GroupTurnColumn', () => {
  it('renders a TurnColumnCell', () => {
    render(<GroupTurnColumn gridRowSpan={2} acted={false} onToggle={vi.fn()} turnAriaLabel="group turn" />)
    expect(screen.getByRole('button', { name: 'group turn' })).toBeInTheDocument()
  })

  it('applies grid-row span style', () => {
    const { container } = render(
      <GroupTurnColumn gridRowSpan={3} acted={false} onToggle={vi.fn()} turnAriaLabel="turn" />,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.gridRow).toBe('1 / span 3')
  })

  it('forwards acted and onToggle to child', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<GroupTurnColumn gridRowSpan={1} acted={true} onToggle={onToggle} turnAriaLabel="turn" />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledOnce()
  })
})
