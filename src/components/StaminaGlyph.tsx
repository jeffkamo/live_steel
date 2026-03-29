import { useId } from 'react'

const staminaHeartPath =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

const STAMINA_LABEL_HEALTHY = 'Healthy'
const STAMINA_LABEL_WINDED = 'Winded'
const STAMINA_LABEL_DEAD = 'Dead / unconscious'

export type StaminaGlyphStatus = 'none' | 'dead' | 'winded' | 'healthy'

export function staminaGlyphStatus(current: number, max: number): StaminaGlyphStatus {
  if (max === 0) {
    return 'none'
  }
  if (current === 0) {
    return 'dead'
  }
  if (current <= Math.floor(max / 2)) {
    return 'winded'
  }
  return 'healthy'
}

/** Shared frame for stamina number chips (standard readout + minion pool segments). */
export const STAMINA_SEGMENT_SHELL =
  'rounded px-1 py-0.5 text-sm font-medium tabular-nums transition-colors'

/** Classes for `current / max` readout chip (matches MinionStaminaDisplay segment styling). */
export function staminaReadoutChipClass(status: StaminaGlyphStatus): string {
  switch (status) {
    case 'none':
      return 'text-sm text-zinc-400'
    case 'dead':
      return `${STAMINA_SEGMENT_SHELL} bg-red-950/60 text-red-400/70 line-through decoration-red-500/50`
    case 'winded':
      return `${STAMINA_SEGMENT_SHELL} bg-amber-950/50 text-amber-300`
    case 'healthy':
      return `${STAMINA_SEGMENT_SHELL} text-zinc-50`
  }
}

function StaminaIcon({
  className,
  broken,
  ariaLabel,
}: {
  className?: string
  broken?: boolean
  ariaLabel: string
}) {
  const clipLeftId = useId()
  const clipRightId = useId()

  if (!broken) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label={ariaLabel}
      >
        <path d={staminaHeartPath} />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <clipPath id={clipLeftId}>
          <rect x="0" y="0" width="11.4" height="24" />
        </clipPath>
        <clipPath id={clipRightId}>
          <rect x="12.6" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipLeftId})`} transform="translate(-0.55 0)">
        <path d={staminaHeartPath} />
      </g>
      <g clipPath={`url(#${clipRightId})`} transform="translate(0.55 0)">
        <path d={staminaHeartPath} />
      </g>
    </svg>
  )
}

const staminaSkullPath =
  'M240 880V710q-39-17-68.5-45.5T121.5 600q-20.5-36-31-77T80 440q0-158 112-259T480 80q176 0 288 101t112 259q0 42-10.5 83T838.5 600q-20.5 36-50 64.5T720 710v170H240zm80-80h40v-80h80v80h80v-80h80v80h40V658q38-9 67.5-30t50.5-50q21-29 31.5-64T800 440q0-125-88.5-202.5T480 160q-143 0-231.5 77.5T160 440q0 39 11 74t31.5 64q20.5 29 50.5 50t67 30v142zm120-200h120l-60-120-60 120zm-80-80q33 0 56.5-23.5T420 440q0-33-23.5-56.5T340 360q-33 0-56.5 23.5T260 440q0 33 23.5 56.5T340 520zm280 0q33 0 56.5-23.5T700 440q0-33-23.5-56.5T620 360q-33 0-56.5 23.5T540 440q0 33 23.5 56.5T620 520z'

/** Filled skull (Material Symbols outline, 960×960 art scaled by viewBox). */
function SkullIcon({ className, ariaLabel }: { className?: string; ariaLabel: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 960 960"
      fill="currentColor"
      role="img"
      aria-label={ariaLabel}
    >
      <path d={staminaSkullPath} />
    </svg>
  )
}

/** Decorative heart (full). Parent should provide semantics (e.g. toggle button). */
export function StaminaHeartFullIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={staminaHeartPath} />
    </svg>
  )
}

/** Decorative skull. Parent should provide semantics (e.g. toggle button). */
export function StaminaSkullIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 960 960" fill="currentColor" aria-hidden>
      <path d={staminaSkullPath} />
    </svg>
  )
}

export function StaminaGlyph({ className, status }: { className: string; status: StaminaGlyphStatus }) {
  if (status === 'none') {
    return null
  }
  const label =
    status === 'dead'
      ? STAMINA_LABEL_DEAD
      : status === 'winded'
        ? STAMINA_LABEL_WINDED
        : STAMINA_LABEL_HEALTHY
  const wrapClass = 'pointer-events-auto inline-flex shrink-0'
  if (status === 'dead') {
    return (
      <span className={wrapClass} title={label}>
        <SkullIcon className={className} ariaLabel={label} />
      </span>
    )
  }
  return (
    <span className={wrapClass} title={label}>
      <StaminaIcon className={className} broken={status === 'winded'} ariaLabel={label} />
    </span>
  )
}
