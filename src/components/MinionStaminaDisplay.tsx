import type { Monster } from '../types'
import {
  minionIntervalFromMonster,
  minionSegmentVisual,
  minionThresholds,
  suggestedDeadCount,
} from '../bestiary'
import {
  StaminaGlyph,
  STAMINA_SEGMENT_SHELL,
  staminaGlyphStatus,
  staminaReadoutChipClass,
} from './StaminaGlyph'

export function MinionStaminaDisplay({
  current,
  max,
  parentMonster,
  minionCount,
  actualDeadCount = 0,
}: {
  current: number
  max: number
  parentMonster: Monster
  minionCount: number
  actualDeadCount?: number
}) {
  const interval = minionIntervalFromMonster(parentMonster)

  if (!interval || minionCount === 0) {
    const glyphStatus = staminaGlyphStatus(current, max)
    return (
      <div className="flex items-center justify-center gap-1.5 tabular-nums">
        <span className={staminaReadoutChipClass(glyphStatus)}>
          {current} / {max}
        </span>
        <StaminaGlyph
          status={glyphStatus}
          className={
            glyphStatus === 'dead'
              ? 'size-4 shrink-0 text-zinc-400'
              : 'size-4 shrink-0 text-rose-300'
          }
        />
      </div>
    )
  }

  const thresholds = minionThresholds(interval, minionCount)
  const suggested = suggestedDeadCount(current, interval, minionCount)
  const mismatch = suggested !== actualDeadCount
  const needKill = suggested > actualDeadCount
  const diff = Math.abs(suggested - actualDeadCount)

  return (
    <div
      role="group"
      aria-label={`Minion stamina pool: ${current} of ${max}`}
      className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5 tabular-nums"
    >
      {thresholds.map((threshold, i) => {
        const prevThreshold = i === 0 ? 0 : thresholds[i - 1]!
        const { display, state } = minionSegmentVisual(current, prevThreshold, threshold)

        return (
          <span key={threshold} className="flex items-center">
            {i > 0 && (
              <span
                className={`mx-0.5 select-none text-xs ${
                  display === 0 ? 'text-zinc-600' : 'text-zinc-500'
                }`}
                aria-hidden
              >
                /
              </span>
            )}
            <span
              data-testid={`threshold-${threshold}`}
              className={`${STAMINA_SEGMENT_SHELL} ${
                state === 'dead'
                  ? 'bg-red-950/60 text-red-400/70 line-through decoration-red-500/50'
                  : state === 'atRisk'
                    ? 'bg-amber-950/50 text-amber-300'
                    : 'text-zinc-50'
              }`}
              title={
                state === 'dead'
                  ? `Cap ${threshold}: bracket empty (0) — dead`
                  : state === 'atRisk'
                    ? `Cap ${threshold}: ${display} stamina in this bracket — at risk`
                    : `Cap ${threshold}: full (${threshold}) — healthy`
              }
            >
              {display}
            </span>
          </span>
        )
      })}
      {mismatch && (
        <span
          data-testid="threshold-mismatch-cue"
          className={`ml-1.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold leading-none animate-pulse ${
            needKill
              ? 'bg-red-950/70 text-red-300'
              : 'bg-emerald-950/70 text-emerald-300'
          }`}
          title={
            needKill
              ? `${diff} minion${diff > 1 ? 's' : ''} should be marked dead`
              : `${diff} minion${diff > 1 ? 's' : ''} can be revived`
          }
          role="status"
        >
          {needKill ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-2.5" aria-hidden>
                <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z" clipRule="evenodd" />
              </svg>
              <span>Kill {diff}</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-2.5" aria-hidden>
                <path d="M8.5 4.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM10.9 12.006c.11.542-.348.994-.9.994H2c-.553 0-1.01-.452-.902-.994a5.002 5.002 0 0 1 9.803 0ZM14.002 12h-1.59a2.556 2.556 0 0 0-.04-.29 6.476 6.476 0 0 0-1.167-2.603 3.002 3.002 0 0 1 3.633 1.911c.18.522-.283.982-.836.982ZM12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              </svg>
              <span>Revive {diff}</span>
            </>
          )}
        </span>
      )}
    </div>
  )
}
