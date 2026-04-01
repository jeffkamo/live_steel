import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TitleRule } from './TitleRule'

describe('TitleRule', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<TitleRule />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies py-2 by default (not flush below)', () => {
    const { container } = render(<TitleRule />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('py-2')
    expect(wrapper.className).not.toContain('pb-0')
  })

  it('applies compact vertical padding when flushBelow is true', () => {
    const { container } = render(<TitleRule flushBelow />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('py-1')
    expect(wrapper.className).not.toContain('py-2')
  })

  it('renders the diamond separator and two rule lines', () => {
    const { container } = render(<TitleRule />)
    const lines = container.querySelectorAll('.h-px')
    expect(lines.length).toBe(2)
    const diamond = container.querySelector('.rotate-45')
    expect(diamond).toBeTruthy()
  })
})
