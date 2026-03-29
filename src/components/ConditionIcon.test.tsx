import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConditionIcon, conditionIconShellClass } from './ConditionIcon'
import { CONDITION_CATALOG } from '../data'

describe('ConditionIcon', () => {
  it('renders an SVG for each known condition', () => {
    for (const label of CONDITION_CATALOG) {
      const { container } = render(<ConditionIcon label={label} />)
      expect(container.querySelector('svg')).toBeTruthy()
    }
  })

  it('returns null for an unknown condition label', () => {
    const { container } = render(<ConditionIcon label="Unknown" />)
    expect(container.firstChild).toBeNull()
  })

  it('applies custom className to the SVG', () => {
    const { container } = render(<ConditionIcon label="Bleeding" className="size-4 text-red-500" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('size-4', 'text-red-500')
  })

  it('marks SVGs as aria-hidden', () => {
    const { container } = render(<ConditionIcon label="Dazed" />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('conditionIconShellClass', () => {
  it('returns dimmed class when not active', () => {
    const cls = conditionIconShellClass(false, null)
    expect(cls).toContain('opacity-[0.58]')
  })

  it('returns neutral active class', () => {
    const cls = conditionIconShellClass(true, 'neutral')
    expect(cls).toContain('opacity-100')
    expect(cls).toContain('bg-zinc-800/90')
  })

  it('returns duration active class for eot', () => {
    const cls = conditionIconShellClass(true, 'eot')
    expect(cls).toContain('border-amber-500/75')
    expect(cls).toContain('ring-1')
  })

  it('returns duration active class for se', () => {
    const cls = conditionIconShellClass(true, 'se')
    expect(cls).toContain('border-purple-500/80')
    expect(cls).toContain('text-purple-200')
  })

  it('adds animate-glow-eot when turnActed is true and state is eot', () => {
    const cls = conditionIconShellClass(true, 'eot', true)
    expect(cls).toContain('animate-glow-eot')
  })

  it('adds animate-glow-se when turnActed is true and state is se', () => {
    const cls = conditionIconShellClass(true, 'se', true)
    expect(cls).toContain('animate-glow-se')
  })

  it('does not add glow animation for eot when turnActed is false', () => {
    const cls = conditionIconShellClass(true, 'eot', false)
    expect(cls).not.toContain('animate-glow-eot')
  })

  it('does not add glow animation for se when turnActed is false', () => {
    const cls = conditionIconShellClass(true, 'se', false)
    expect(cls).not.toContain('animate-glow-se')
  })

  it('suppresses SE glow when fourth argument is false even if eot glow is true', () => {
    const cls = conditionIconShellClass(true, 'se', true, false)
    expect(cls).not.toContain('animate-glow-se')
  })

  it('does not add glow animation for neutral state even when turnActed is true', () => {
    const cls = conditionIconShellClass(true, 'neutral', true)
    expect(cls).not.toContain('animate-glow')
  })

  it('does not add glow animation for inactive conditions even when turnActed is true', () => {
    const cls = conditionIconShellClass(false, null, true)
    expect(cls).not.toContain('animate-glow')
  })

  it('includes motion-reduce:animate-none alongside glow animation', () => {
    const eotCls = conditionIconShellClass(true, 'eot', true)
    expect(eotCls).toContain('motion-reduce:animate-none')
    const seCls = conditionIconShellClass(true, 'se', true)
    expect(seCls).toContain('motion-reduce:animate-none')
  })
})
