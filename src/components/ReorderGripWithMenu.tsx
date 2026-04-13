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

/** Which named Tailwind `group/*` ancestor drives hover visibility (must match parent `group/…` class). */
export type ReorderGripRowHoverGroup = 'creature-row' | 'encounter-card'

export function ReorderGripWithMenu({
  reorderAriaLabel,
  onDragStart,
  onDragEnd,
  menuItems,
  className,
  iconClassName,
  draggable = true,
  rowHoverGroup = 'creature-row',
  getDragImageElement,
}: {
  reorderAriaLabel: string
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
  menuItems: readonly ReorderGripMenuItem[]
  className: string
  iconClassName: string
  /** When false, the grip opens the menu on click but does not initiate HTML5 drag (e.g. fixed rows). */
  draggable?: boolean
  /**
   * `creature-row`: parent row is `group/row-reorder` (monster / terrain / malice rows).
   * `encounter-card`: parent is `group/encounter-card` on the whole encounter grid (hover anywhere in the group).
   */
  rowHoverGroup?: ReorderGripRowHoverGroup
  /** Element used as the drag preview (defaults to the small grip). Typically the full row/card wrapper. */
  getDragImageElement?: () => HTMLElement | null
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
      if (!draggable) return
      dragDidStartRef.current = true
      onDragStart(e)
      const imgEl = getDragImageElement?.()
      const dt = e.dataTransfer
      if (imgEl != null && dt != null && typeof dt.setDragImage === 'function') {
        try {
          const r = imgEl.getBoundingClientRect()
          dt.setDragImage(imgEl, Math.round(e.clientX - r.left), Math.round(e.clientY - r.top))
        } catch {
          /* setDragImage unsupported or throws in some test environments */
        }
      }
    },
    [draggable, getDragImageElement, onDragStart],
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

  const showChrome = open
  const visibilityClass =
    rowHoverGroup === 'encounter-card'
      ? 'opacity-0 pointer-events-none transition-opacity duration-150 ease-out motion-reduce:transition-none ' +
        'group-hover/encounter-card:opacity-100 group-hover/encounter-card:pointer-events-auto ' +
        'focus-within:opacity-100 focus-within:pointer-events-auto' +
        (showChrome ? ' !opacity-100 !pointer-events-auto' : '')
      : 'opacity-0 pointer-events-none transition-opacity duration-150 ease-out motion-reduce:transition-none ' +
        'group-hover/row-reorder:opacity-100 group-hover/row-reorder:pointer-events-auto ' +
        'focus-within:opacity-100 focus-within:pointer-events-auto' +
        (showChrome ? ' !opacity-100 !pointer-events-auto' : '')

  const rowHoverPillClass =
    rowHoverGroup === 'encounter-card'
      ? 'group-hover/encounter-card:border-zinc-300 group-hover/encounter-card:bg-zinc-200 group-hover/encounter-card:shadow-sm dark:group-hover/encounter-card:border-zinc-600 dark:group-hover/encounter-card:bg-zinc-800'
      : 'group-hover/row-reorder:border-zinc-300 group-hover/row-reorder:bg-zinc-200 group-hover/row-reorder:shadow-sm dark:group-hover/row-reorder:border-zinc-600 dark:group-hover/row-reorder:bg-zinc-800'

  return (
    <div
      ref={rootRef}
      data-grip-menu-open={open || undefined}
      className={`pointer-events-none flex min-h-0 min-w-0 flex-col items-center justify-center self-stretch ${open ? 'relative z-[200]' : ''}`}
    >
      <div className={`flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center ${visibilityClass}`}>
        <div
          draggable={draggable}
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
          className={`group/grip relative box-border inline-flex min-h-0 flex-none items-center justify-center border border-transparent bg-transparent transition-[width,min-width,max-width,background-color,border-color,box-shadow,color] duration-150 ease-out motion-reduce:transition-none ${open ? 'overflow-visible' : 'overflow-hidden'} ${rowHoverPillClass} w-1.5 min-w-1.5 max-w-1.5 hover:w-5 hover:min-w-5 hover:max-w-none hover:border-zinc-400 hover:bg-zinc-300 sm:hover:w-6 sm:hover:min-w-6 dark:hover:border-zinc-500 dark:hover:bg-zinc-700 focus-visible:w-5 focus-visible:min-w-5 focus-visible:max-w-none focus-visible:border-zinc-400 focus-visible:bg-zinc-300 focus-visible:[&_.reorder-grip-icon]:opacity-100 focus-visible:[&>span]:px-1 sm:focus-visible:w-6 sm:focus-visible:min-w-6 sm:focus-visible:[&>span]:px-1.5 dark:focus-visible:border-zinc-500 dark:focus-visible:bg-zinc-700 active:cursor-grabbing ${open ? '!w-7 !min-w-7 !max-w-none sm:!w-8 sm:!min-w-8 [&>span]:px-1 sm:[&>span]:px-1.5 !border-zinc-400 !bg-zinc-300 dark:!border-zinc-500 dark:!bg-zinc-700' : ''} ${className}`}
        >
          <span
            className={`relative flex size-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-[inherit] px-0 transition-[padding] duration-150 ease-out motion-reduce:transition-none group-hover/grip:px-1 sm:group-hover/grip:px-1.5 ${open ? '!px-1 sm:!px-1.5' : ''}`}
          >
            <ReorderGripIcon
              className={`${iconClassName} h-3.5 w-[7px] shrink-0 opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none group-hover/grip:opacity-100 dark:group-hover/grip:text-zinc-100 ${open ? '!opacity-100' : ''}`}
            />
          </span>
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
        </div>
      </div>
    </div>
  )
}
