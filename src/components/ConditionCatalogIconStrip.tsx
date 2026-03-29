import type { ConditionEntry } from '../types'
import { CONDITION_CATALOG, conditionCatalogTooltip, findConditionOnMonster } from '../data'
import { ConditionIcon, conditionIconHoverOutline, conditionIconShellClass } from './ConditionIcon'

const conditionStripOutlinePad = 'py-1.5 -my-1.5 px-1.5 -mx-1.5'
const conditionStripScrollbar =
  'pb-px [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600/80'

export function ConditionCatalogIconStrip({
  conditions,
  interactive,
  onToggleLabel,
  turnActed = false,
}: {
  conditions: readonly ConditionEntry[]
  interactive: boolean
  onToggleLabel?: (label: string) => void
  turnActed?: boolean
}) {
  const iconRow = CONDITION_CATALOG.map((label) => {
    const active = findConditionOnMonster(conditions, label)
    const tip = conditionCatalogTooltip(label, active)
    const shell = conditionIconShellClass(active !== undefined, active?.state ?? null, turnActed)
    if (interactive && onToggleLabel) {
      return (
        <button
          key={label}
          type="button"
          data-condition-toggle
          title={tip}
          aria-label={active ? `Remove ${label}` : `Add ${label}`}
          aria-pressed={active !== undefined}
          onClick={(e) => {
            e.stopPropagation()
            onToggleLabel(label)
          }}
          className={`${shell} ${conditionIconHoverOutline} cursor-pointer hover:brightness-110 focus-visible:z-[1] focus-visible:outline-amber-600/80 focus-visible:outline-offset-2`}
        >
          <ConditionIcon label={label} className="size-[0.875rem] shrink-0" />
        </button>
      )
    }
    return (
      <span
        key={label}
        title={tip}
        aria-label={tip}
        role="img"
        className={`${shell} ${conditionIconHoverOutline}`}
      >
        <ConditionIcon label={label} className="size-[0.875rem] shrink-0" />
      </span>
    )
  })

  if (interactive) {
    return (
      <div
        className={`inline-flex max-w-full flex-nowrap items-center justify-start gap-[0.1875rem] ${conditionStripOutlinePad}`}
      >
        {iconRow}
      </div>
    )
  }

  return (
    <div
      className={`max-w-full min-w-0 overflow-x-auto ${conditionStripOutlinePad} ${conditionStripScrollbar}`}
    >
      <div className="inline-flex flex-nowrap items-center justify-start gap-[0.1875rem]">{iconRow}</div>
    </div>
  )
}
