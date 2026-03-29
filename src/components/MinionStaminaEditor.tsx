import { minionInterval, minionSegmentVisual, minionThresholds } from '../bestiary'
import { STAMINA_SEGMENT_SHELL } from './StaminaGlyph'

const bumpMinusClass =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-500/75 bg-zinc-800/40 font-sans text-[0.58rem] font-semibold tabular-nums text-zinc-300 transition-colors hover:border-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:bg-zinc-900 sm:h-9 sm:w-9 sm:text-[0.62rem]'

const bumpPlusClass =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200/85 bg-zinc-800/30 font-sans text-[0.58rem] font-semibold tabular-nums text-zinc-50 transition-colors hover:border-white hover:bg-zinc-700/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:bg-zinc-900 sm:h-9 sm:w-9 sm:text-[0.62rem]'

export function MinionStaminaEditor({
  current,
  bump,
  parentName,
  firstMinionName,
  minionCount,
}: {
  current: number
  bump: (delta: number) => void
  parentName: string
  firstMinionName?: string
  minionCount: number
}) {
  const interval = minionInterval(parentName, firstMinionName)

  if (!interval || minionCount === 0) {
    return null
  }

  const thresholds = minionThresholds(interval, minionCount)

  return (
    <div className="flex flex-nowrap items-center gap-2 rounded-lg border border-zinc-500/80 bg-zinc-900 py-1.5 pl-2 pr-2 shadow-xl shadow-black/50 ring-1 ring-black/20">
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className={bumpMinusClass}
          aria-label="Decrease stamina by 10"
          onClick={() => bump(-10)}
        >
          −10
        </button>
        <button
          type="button"
          className={bumpMinusClass}
          aria-label="Decrease stamina by 1"
          onClick={() => bump(-1)}
        >
          −1
        </button>
      </div>
      <div
        role="group"
        aria-label="Minion stamina intervals"
        className="flex shrink-0 items-center gap-0.5 rounded-md bg-zinc-100 px-2 py-1 shadow-inner shadow-zinc-300/30"
      >
        {thresholds.map((threshold, i) => {
          const prevThreshold = i === 0 ? 0 : thresholds[i - 1]!
          const { display, state } = minionSegmentVisual(current, prevThreshold, threshold)

          return (
            <span key={threshold} className="flex items-center">
              {i > 0 && (
                <span
                  className={`mx-0.5 select-none text-sm ${
                    display === 0 ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                  aria-hidden
                >
                  /
                </span>
              )}
              <span
                data-testid={`editor-threshold-${threshold}`}
                className={`${STAMINA_SEGMENT_SHELL} ${
                  state === 'dead'
                    ? 'bg-red-200/60 text-red-700 line-through decoration-red-500/50'
                    : state === 'atRisk'
                      ? 'bg-amber-200/50 text-amber-700'
                      : 'text-zinc-950'
                }`}
              >
                {display}
              </span>
            </span>
          )
        })}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className={bumpPlusClass}
          aria-label="Increase stamina by 1"
          onClick={() => bump(1)}
        >
          +1
        </button>
        <button
          type="button"
          className={bumpPlusClass}
          aria-label="Increase stamina by 10"
          onClick={() => bump(10)}
        >
          +10
        </button>
      </div>
    </div>
  )
}
