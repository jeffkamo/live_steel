import { minionInterval, minionThresholds } from '../bestiary'
import { StaminaGlyph, staminaGlyphStatus } from './StaminaGlyph'

export function MinionStaminaDisplay({
  current,
  max,
  parentName,
  firstMinionName,
  minionCount,
}: {
  current: number
  max: number
  parentName: string
  firstMinionName?: string
  minionCount: number
}) {
  const interval = minionInterval(parentName, firstMinionName)

  if (!interval || minionCount === 0) {
    const glyphStatus = staminaGlyphStatus(current, max)
    return (
      <div className="flex items-center justify-center gap-1.5 tabular-nums">
        <span className="text-sm text-zinc-50">
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

  return (
    <div
      role="group"
      aria-label={`Minion stamina pool: ${current} of ${max}`}
      className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5 tabular-nums"
    >
      {thresholds.map((threshold, i) => {
        const prevThreshold = i === 0 ? 0 : thresholds[i - 1]!
        const alive = current > prevThreshold
        const crossed = current < threshold

        return (
          <span key={threshold} className="flex items-center">
            {i > 0 && (
              <span
                className={`mx-0.5 select-none text-[0.6rem] ${
                  crossed ? 'text-zinc-600' : 'text-zinc-500'
                }`}
                aria-hidden
              >
                /
              </span>
            )}
            <span
              data-testid={`threshold-${threshold}`}
              className={`rounded px-1 py-0.5 text-xs font-medium transition-colors ${
                !alive
                  ? 'bg-red-950/60 text-red-400/70 line-through decoration-red-500/50'
                  : crossed
                    ? 'bg-amber-950/50 text-amber-300'
                    : 'text-zinc-50'
              }`}
              title={
                !alive
                  ? `Threshold ${threshold}: minion dead`
                  : crossed
                    ? `Threshold ${threshold}: minion at risk (stamina below ${threshold})`
                    : `Threshold ${threshold}: minion healthy`
              }
            >
              {threshold}
            </span>
          </span>
        )
      })}
    </div>
  )
}
