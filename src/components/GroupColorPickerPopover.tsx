import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GroupColorId } from '../types'
import {
  GROUP_COLOR_LABEL,
  GROUP_COLOR_ORDER,
  GROUP_COLOR_PREVIEW_HEX,
  otherGroupIndexForColor,
} from '../data'
import { focusRelativeIn, listFocusableIn, tabWrapKeyDown } from '../dropdownA11y'

function GroupColorPreview({ colorId }: { colorId: GroupColorId }) {
  return (
    <span
      className="size-3.5 shrink-0 rounded-sm border border-zinc-300 dark:border-zinc-600/90 shadow-inner shadow-black/30"
      style={{ backgroundColor: GROUP_COLOR_PREVIEW_HEX[colorId] }}
      aria-hidden
    />
  )
}

export function GroupColorSwapIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}

const groupColorPickerRowBtn =
  'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left font-sans text-[0.72rem] font-medium text-zinc-900 dark:text-zinc-100 transition-colors hover:bg-zinc-300/85 dark:hover:bg-zinc-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

export function GroupColorPickerPopover({
  open,
  anchor,
  groupKey,
  groupNumber,
  thisGroupIndex,
  encounterGroupColors,
  currentColor,
  onSelectColor,
  onClose,
}: {
  open: boolean
  anchor: HTMLElement | null
  groupKey: string
  groupNumber: number
  thisGroupIndex: number
  encounterGroupColors: readonly GroupColorId[]
  currentColor: GroupColorId
  onSelectColor: (color: GroupColorId) => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [hoverRowColorId, setHoverRowColorId] = useState<GroupColorId | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setCoords(null)
      return
    }
    const place = () => {
      const r = anchor.getBoundingClientRect()
      setCoords({ top: r.bottom + 4, left: r.left + r.width / 2 })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, anchor])

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (menuRef.current?.contains(el)) {
        return
      }
      if (el.closest(`[data-group-color-trigger="${groupKey}"]`)) {
        return
      }
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, groupKey, onClose])

  useEffect(() => {
    if (!open) {
      setHoverRowColorId(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      const t = returnFocusRef.current
      returnFocusRef.current = null
      queueMicrotask(() => {
        if (t?.isConnected) t.focus()
      })
      return
    }
    if (!coords) return
    returnFocusRef.current = anchor
    let attached: HTMLDivElement | null = null
    const onMenuKeyDown = (e: KeyboardEvent) => {
      const root = menuRef.current
      if (!root?.contains(e.target as Node)) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      tabWrapKeyDown(e, root)
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
    }
    const id = requestAnimationFrame(() => {
      attached = menuRef.current
      if (!attached) return
      listFocusableIn(attached)[0]?.focus()
      attached.addEventListener('keydown', onMenuKeyDown)
    })
    return () => {
      cancelAnimationFrame(id)
      attached?.removeEventListener('keydown', onMenuKeyDown)
    }
  }, [open, coords, anchor, onClose])

  if (!open || !coords) {
    return null
  }

  const otherOwnerOfHovered =
    hoverRowColorId !== null
      ? otherGroupIndexForColor(hoverRowColorId, encounterGroupColors, thisGroupIndex)
      : null
  const hoverWouldSwap =
    hoverRowColorId !== null &&
    hoverRowColorId !== currentColor &&
    otherOwnerOfHovered !== null

  return createPortal(
    <div
      ref={menuRef}
      data-group-color-picker
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-50%)',
        zIndex: 200,
      }}
      className="w-[min(15.5rem,calc(100vw-2rem))] max-h-[min(20rem,50vh)] overflow-y-auto rounded-lg border border-zinc-500/75 bg-zinc-100 dark:bg-zinc-900 py-1.5 pl-2 pr-1.5 shadow-xl shadow-black/50 ring-1 ring-black/25"
      role="dialog"
      aria-label={`Choose color for encounter group ${groupNumber}`}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="flex flex-col gap-0.5" role="list">
        {GROUP_COLOR_ORDER.map((id) => {
          const selected = id === currentColor
          const otherOwner = otherGroupIndexForColor(id, encounterGroupColors, thisGroupIndex)
          const inUseElsewhere = otherOwner !== null
          const ownerGroupNumber = otherOwner !== null ? otherOwner + 1 : null
          const showSwapIcon =
            hoverWouldSwap && (id === hoverRowColorId || id === currentColor)
          const conflictingGroupNumber =
            otherOwnerOfHovered !== null ? otherOwnerOfHovered + 1 : null

          let rowTitle: string | undefined
          if (hoverWouldSwap && id === hoverRowColorId && conflictingGroupNumber !== null) {
            rowTitle = `Swap with group ${conflictingGroupNumber}: they receive ${GROUP_COLOR_LABEL[currentColor]}, you receive ${GROUP_COLOR_LABEL[id]}.`
          } else if (hoverWouldSwap && id === currentColor && conflictingGroupNumber !== null) {
            rowTitle = `${GROUP_COLOR_LABEL[currentColor]} would move to group ${conflictingGroupNumber}.`
          } else if (inUseElsewhere && ownerGroupNumber !== null) {
            rowTitle = `Used by group ${ownerGroupNumber}. Click to swap colors.`
          }

          return (
            <li
              key={id}
              onMouseEnter={() => setHoverRowColorId(id)}
              onMouseLeave={() => setHoverRowColorId(null)}
            >
              <button
                type="button"
                title={rowTitle}
                className={`${groupColorPickerRowBtn} relative ${selected ? 'bg-zinc-200 dark:bg-zinc-800/90' : ''} ${
                  showSwapIcon ? 'bg-amber-950/35 ring-1 ring-amber-500/45' : ''
                }`}
                onClick={() => {
                  onSelectColor(id)
                  onClose()
                }}
              >
                <GroupColorPreview colorId={id} />
                <span className="min-w-0 flex-1">{GROUP_COLOR_LABEL[id]}</span>
                {inUseElsewhere && ownerGroupNumber !== null ? (
                  <span
                    className="shrink-0 rounded border border-zinc-300 dark:border-zinc-600/70 px-1 py-px font-sans text-[0.55rem] font-semibold tabular-nums uppercase tracking-wide text-zinc-500"
                    aria-label={`Color in use by group ${ownerGroupNumber}`}
                  >
                    G{ownerGroupNumber}
                  </span>
                ) : null}
                {showSwapIcon ? (
                  <span
                    className="flex size-5 shrink-0 items-center justify-center text-amber-400/95"
                    title="Swap colors"
                  >
                    <GroupColorSwapIcon className="size-4" />
                  </span>
                ) : (
                  <span className="size-5 shrink-0" aria-hidden />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>,
    document.body,
  )
}
