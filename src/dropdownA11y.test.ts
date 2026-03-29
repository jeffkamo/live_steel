import { createElement as h } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { listFocusableIn, focusRelativeIn, tabWrapKeyDown } from './dropdownA11y'

describe('dropdownA11y', () => {
  describe('listFocusableIn', () => {
    it('returns buttons and inputs in DOM order', () => {
      const { container } = render(
        h(
          'div',
          null,
          h('button', { type: 'button' }, 'a'),
          h('input', { 'aria-label': 'x' }),
          h('button', { type: 'button' }, 'b'),
        ),
      )
      const root = container.firstChild as HTMLElement
      const list = listFocusableIn(root)
      expect(list.map((el) => el.tagName)).toEqual(['BUTTON', 'INPUT', 'BUTTON'])
    })

    it('skips disabled buttons and tabindex=-1', () => {
      const { container } = render(
        h(
          'div',
          null,
          h('button', { type: 'button' }, 'ok'),
          h('button', { type: 'button', disabled: true }, 'no'),
          h('button', { type: 'button', tabIndex: -1 }, 'skip'),
        ),
      )
      const root = container.firstChild as HTMLElement
      expect(listFocusableIn(root)).toHaveLength(1)
    })
  })

  describe('tabWrapKeyDown', () => {
    it('wraps Tab from last to first focusable', () => {
      const { container } = render(
        h(
          'div',
          null,
          h('button', { type: 'button' }, 'a'),
          h('button', { type: 'button' }, 'b'),
        ),
      )
      const root = container.firstChild as HTMLElement
      const buttons = listFocusableIn(root)
      buttons[1]!.focus()
      const e = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
      const prevent = vi.spyOn(e, 'preventDefault')
      tabWrapKeyDown(e, root)
      expect(prevent).toHaveBeenCalled()
      expect(document.activeElement).toBe(buttons[0])
    })
  })

  describe('focusRelativeIn', () => {
    it('moves focus by delta', () => {
      const { container } = render(
        h(
          'div',
          null,
          h('button', { type: 'button' }, 'a'),
          h('button', { type: 'button' }, 'b'),
        ),
      )
      const root = container.firstChild as HTMLElement
      const buttons = listFocusableIn(root)
      buttons[0]!.focus()
      focusRelativeIn(root, 1)
      expect(document.activeElement).toBe(buttons[1])
      focusRelativeIn(root, 1)
      expect(document.activeElement).toBe(buttons[0])
    })
  })
})
