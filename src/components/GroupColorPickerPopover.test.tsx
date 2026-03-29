import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GroupColorPickerPopover, GroupColorSwapIcon } from './GroupColorPickerPopover'
import { GROUP_COLOR_ORDER, GROUP_COLOR_LABEL } from '../data'
import type { GroupColorId } from '../types'

function makeAnchor(): HTMLElement {
  const el = document.createElement('div')
  document.body.appendChild(el)
  el.getBoundingClientRect = () => ({
    top: 100,
    bottom: 140,
    left: 50,
    right: 90,
    width: 40,
    height: 40,
    x: 50,
    y: 100,
    toJSON: () => {},
  })
  return el
}

const baseProps = {
  groupKey: 'g0',
  groupNumber: 1,
  thisGroupIndex: 0,
  encounterGroupColors: ['red', 'blue', 'green', 'purple'] as GroupColorId[],
  currentColor: 'red' as GroupColorId,
  onSelectColor: vi.fn(),
  onClose: vi.fn(),
}

describe('GroupColorPickerPopover', () => {
  it('renders nothing when open is false', () => {
    render(
      <GroupColorPickerPopover open={false} anchor={null} {...baseProps} />,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders dialog when open with anchor', () => {
    const anchor = makeAnchor()
    render(
      <GroupColorPickerPopover open={true} anchor={anchor} {...baseProps} />,
    )
    expect(screen.getByRole('dialog', { name: /^Choose color for encounter group 1$/i })).toBeInTheDocument()
    anchor.remove()
  })

  it('lists all 10 color options', () => {
    const anchor = makeAnchor()
    render(
      <GroupColorPickerPopover open={true} anchor={anchor} {...baseProps} />,
    )
    const picker = screen.getByRole('dialog')
    for (const id of GROUP_COLOR_ORDER) {
      expect(within(picker).getByText(GROUP_COLOR_LABEL[id])).toBeInTheDocument()
    }
    anchor.remove()
  })

  it('calls onSelectColor and onClose when a color is clicked', async () => {
    const user = userEvent.setup()
    const anchor = makeAnchor()
    const onSelect = vi.fn()
    const onClose = vi.fn()
    render(
      <GroupColorPickerPopover
        open={true}
        anchor={anchor}
        {...baseProps}
        onSelectColor={onSelect}
        onClose={onClose}
      />,
    )
    await user.click(screen.getByText('Blue'))
    expect(onSelect).toHaveBeenCalledWith('blue')
    expect(onClose).toHaveBeenCalledOnce()
    anchor.remove()
  })

  it('shows "in use" badge for colors used by other groups', () => {
    const anchor = makeAnchor()
    render(
      <GroupColorPickerPopover open={true} anchor={anchor} {...baseProps} />,
    )
    const picker = screen.getByRole('dialog')
    expect(within(picker).getByText('G2')).toBeInTheDocument()
    expect(within(picker).getByText('G3')).toBeInTheDocument()
    expect(within(picker).getByText('G4')).toBeInTheDocument()
    anchor.remove()
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    const anchor = makeAnchor()
    const onClose = vi.fn()
    render(
      <GroupColorPickerPopover
        open={true}
        anchor={anchor}
        {...baseProps}
        onClose={onClose}
      />,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
    anchor.remove()
  })

  it('moves focus into dialog and supports ArrowDown between color rows', async () => {
    const user = userEvent.setup()
    const anchor = makeAnchor()
    anchor.tabIndex = 0
    anchor.focus()
    render(
      <GroupColorPickerPopover open={true} anchor={anchor} {...baseProps} />,
    )
    const dialog = screen.getByRole('dialog')
    const buttons = within(dialog).getAllByRole('button')
    await waitFor(() => {
      expect(buttons.some((b) => b === document.activeElement)).toBe(true)
    })
    const startIdx = buttons.findIndex((b) => b === document.activeElement)
    expect(startIdx).toBeGreaterThanOrEqual(0)
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(buttons[(startIdx + 1) % buttons.length])
    anchor.remove()
  })

  it('closes on click outside', async () => {
    const user = userEvent.setup()
    const anchor = makeAnchor()
    const onClose = vi.fn()
    render(
      <GroupColorPickerPopover
        open={true}
        anchor={anchor}
        {...baseProps}
        onClose={onClose}
      />,
    )
    await user.click(document.body)
    expect(onClose).toHaveBeenCalledOnce()
    anchor.remove()
  })
})

describe('GroupColorSwapIcon', () => {
  it('renders an SVG with aria-hidden', () => {
    const { container } = render(<GroupColorSwapIcon className="size-4" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies className', () => {
    const { container } = render(<GroupColorSwapIcon className="size-4 text-amber-400" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('size-4', 'text-amber-400')
  })
})
