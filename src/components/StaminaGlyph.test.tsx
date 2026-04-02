import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StaminaGlyph, staminaGlyphStatus, staminaReadoutChipClass } from './StaminaGlyph'

describe('staminaGlyphStatus', () => {
  it('returns "none" when max is 0', () => {
    expect(staminaGlyphStatus(0, 0)).toBe('none')
  })

  it('returns "dead" when current is 0 and max > 0', () => {
    expect(staminaGlyphStatus(0, 10)).toBe('dead')
  })

  it('returns "winded" when current is exactly half of max', () => {
    expect(staminaGlyphStatus(5, 10)).toBe('winded')
  })

  it('returns "winded" when current is below half of max', () => {
    expect(staminaGlyphStatus(3, 10)).toBe('winded')
  })

  it('returns "healthy" when current is above half of max', () => {
    expect(staminaGlyphStatus(6, 10)).toBe('healthy')
  })

  it('returns "healthy" when current equals max', () => {
    expect(staminaGlyphStatus(10, 10)).toBe('healthy')
  })

  it('uses floor for half calculation (odd max)', () => {
    expect(staminaGlyphStatus(7, 15)).toBe('winded')
    expect(staminaGlyphStatus(8, 15)).toBe('healthy')
  })
})

describe('staminaReadoutChipClass', () => {
  it('maps stamina states to chip classes (minion segment parity)', () => {
    expect(staminaReadoutChipClass('none')).toBe('text-sm text-zinc-400')
    expect(staminaReadoutChipClass('healthy')).toMatch(/text-sm/)
    expect(staminaReadoutChipClass('healthy')).toMatch(/text-zinc-800/)
    expect(staminaReadoutChipClass('healthy')).not.toMatch(/bg-/)
    expect(staminaReadoutChipClass('winded')).toMatch(/text-sm/)
    expect(staminaReadoutChipClass('winded')).toMatch(/bg-amber-100\/90/)
    expect(staminaReadoutChipClass('winded')).toMatch(/text-amber-800/)
    expect(staminaReadoutChipClass('dead')).toMatch(/bg-red-100\/90/)
    expect(staminaReadoutChipClass('dead')).toMatch(/line-through/)
  })
})

describe('StaminaGlyph', () => {
  it('renders nothing for "none" status', () => {
    const { container } = render(<StaminaGlyph status="none" className="size-4" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a healthy heart', () => {
    render(<StaminaGlyph status="healthy" className="size-4" />)
    expect(screen.getByRole('img', { name: 'Healthy' })).toBeInTheDocument()
  })

  it('renders a winded (broken) heart', () => {
    render(<StaminaGlyph status="winded" className="size-4" />)
    expect(screen.getByRole('img', { name: 'Winded' })).toBeInTheDocument()
  })

  it('renders a skull for dead status', () => {
    render(<StaminaGlyph status="dead" className="size-4" />)
    expect(screen.getByRole('img', { name: /Dead/i })).toBeInTheDocument()
  })

  it('wraps glyph with a title tooltip', () => {
    render(<StaminaGlyph status="healthy" className="size-4" />)
    expect(screen.getByTitle('Healthy')).toBeInTheDocument()
  })

  it('applies the className to the svg element', () => {
    render(<StaminaGlyph status="healthy" className="size-4 text-rose-300" />)
    const svg = screen.getByRole('img', { name: 'Healthy' })
    expect(svg).toHaveClass('size-4', 'text-rose-300')
  })
})
