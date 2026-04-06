import type { Marip } from '../types'
import { MARIP_HEADERS } from '../data'

export function MaripCluster({ values }: { values: Marip | null }) {
  const track = 'grid w-full min-w-0 grid-cols-5 gap-x-1 text-center sm:gap-x-1.5'
  return (
    <div
      className="flex w-full min-w-0 flex-col justify-center gap-0"
      role="group"
      aria-label="Characteristics (MARIP)"
    >
      <div
        className={`${track} pb-0.5 font-draw-steel text-sm uppercase tracking-wide text-zinc-600 dark:text-zinc-300 sm:text-base`}
      >
        {MARIP_HEADERS.map(({ letter, title }) => (
          <span key={letter} title={title}>
            {letter}
          </span>
        ))}
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-xs text-zinc-900 dark:text-zinc-50 sm:text-sm`}>
        {values === null
          ? MARIP_HEADERS.map(({ letter }) => (
              <span key={`${letter}-val`} className="text-zinc-500 dark:text-zinc-400">
                —
              </span>
            ))
          : values.map((v, i) => <span key={i}>{v}</span>)}
      </div>
    </div>
  )
}
