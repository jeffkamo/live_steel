import type { Marip } from '../types'
import { MARIP_HEADERS } from '../data'

export function MaripCluster({ values }: { values: Marip | null }) {
  /**
   * Content-sized columns + tight gap so MARIP stays a compact cluster (no 1fr stretch).
   * Min width on cells keeps narrow glyphs (e.g. I) readable when the roster column is tight.
   */
  const track =
    'mx-auto grid w-max max-w-full grid-cols-[repeat(5,auto)] justify-items-center gap-x-0.5 text-center sm:gap-x-1'
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
          <span
            key={letter}
            className="inline-flex min-w-[1.5rem] justify-center px-px sm:min-w-[1.625rem]"
            title={title}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-xs text-zinc-900 dark:text-zinc-50 sm:text-sm`}>
        {values === null
          ? MARIP_HEADERS.map(({ letter }) => (
              <span
                key={`${letter}-val`}
                className="inline-flex min-w-[1.5rem] justify-center px-px text-zinc-500 dark:text-zinc-400 sm:min-w-[1.625rem]"
              >
                —
              </span>
            ))
          : values.map((v, i) => (
              <span
                key={i}
                className="inline-flex min-w-[1.5rem] justify-center px-px sm:min-w-[1.625rem]"
              >
                {v}
              </span>
            ))}
      </div>
    </div>
  )
}
