import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { focusRelativeIn, listFocusableIn, tabWrapKeyDown } from '../dropdownA11y'
import { ReorderGripIcon } from './ReorderGripIcon'

export type ReorderGripMenuItem = {
  id: string
  label: string
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

export function ReorderGripWithMenu({
  reorderAriaLabel,
  onDragStart,
  onDragEnd,
  menuItems,
  className,
  iconClassName,
}: {
  reorderAriaLabel: string
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
  menuItems: readonly ReorderGripMenuItem[]
  className: string
  iconClassName: string
}) {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const dragDidStartRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const closeMenu = useCallback(() => setOpen(false), [])

  const wrapDragStart = useCallback(
    (e: DragEvent) => {
      dragDidStartRef.current = true
      onDragStart(e)
    },
    [onDragStart],
  )

  const wrapDragEnd = useCallback(
    (e: DragEvent) => {
      onDragEnd(e)
      window.setTimeout(() => {
        dragDidStartRef.current = false
      }, 0)
    },
    [onDragEnd],
  )

  useEffect(() => {
    if (!open) {
      const r = returnFocusRef.current
      returnFocusRef.current = null
      queueMicrotask(() => r?.focus?.())
      return
    }
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const id = requestAnimationFrame(() => {
      listFocusableIn(menuRef.current!)[0]?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, closeMenu])

  const onGripClick = useCallback(() => {
    if (dragDidStartRef.current) return
    if (menuItems.length === 0) return
    setOpen((v) => !v)
  }, [menuItems.length])

  return (
    <div ref={rootRef} data-grip-menu-open={open || undefined} className={`h-full min-h-0 self-stretch ${open ? 'relative z-[200]' : ''}`}>
      <div
        draggable
        onDragStart={wrapDragStart}
        onDragEnd={wrapDragEnd}
        onClick={onGripClick}
        onKeyDown={(e) => {
          if (menuItems.length === 0) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={reorderAriaLabel}
        aria-haspopup={menuItems.length > 0 ? 'menu' : undefined}
        aria-expanded={menuItems.length > 0 ? open : undefined}
        aria-controls={open ? menuId : undefined}
        className={`${className} h-full min-h-0`}
      >
        <span className="relative inline-flex shrink-0">
          <ReorderGripIcon className={iconClassName} />
          {open && menuItems.length > 0 && (
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Row actions"
              className="absolute left-0 top-full z-[60] mt-1 min-w-[10.5rem] rounded-lg border border-zinc-300/85 dark:border-zinc-700/80 bg-zinc-100 dark:bg-zinc-900 py-1 shadow-xl"
              onKeyDown={(e) => {
                const root = e.currentTarget
                if (e.key === 'Escape') {
                  e.preventDefault()
                  closeMenu()
                  return
                }
                tabWrapKeyDown(e.nativeEvent, root)
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  focusRelativeIn(root, 1)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  focusRelativeIn(root, -1)
                } else if (e.key === 'Home') {
                  e.preventDefault()
                  listFocusableIn(root)[0]?.focus()
                } else if (e.key === 'End') {
                  e.preventDefault()
                  const list = listFocusableIn(root)
                  list[list.length - 1]?.focus()
                }
              }}
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  data-testid={`grip-menu-${item.id}`}
                  disabled={item.disabled}
                  aria-disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return
                    item.onSelect()
                    closeMenu()
                  }}
                  className={`flex w-full px-3 py-2 text-left text-xs transition-colors ${
                    item.disabled
                      ? 'cursor-default text-zinc-500'
                      : item.destructive
                        ? 'cursor-pointer text-red-400 hover:bg-zinc-300 dark:hover:bg-zinc-800'
                        : 'cursor-pointer text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </span>
      </div>
    </div>
  )
}
