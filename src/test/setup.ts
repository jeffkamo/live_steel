import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

if (typeof window !== 'undefined' && window.matchMedia === undefined) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    private readonly callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe(target: Element): void {
      requestAnimationFrame(() => {
        this.callback(
          [
            {
              target,
              contentRect: target.getBoundingClientRect(),
              borderBoxSize: [],
              contentBoxSize: [],
              devicePixelContentBoxSize: [],
            } as ResizeObserverEntry,
          ],
          this,
        )
      })
    }
    unobserve(): void {}
    disconnect(): void {}
  }
}

afterEach(() => {
  cleanup()
})
