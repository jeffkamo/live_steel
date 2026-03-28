import type { Marip } from '../types'
import { MARIP_HEADERS } from '../data'

export function MaripCluster({ values }: { values: Marip | null }) {
  const track = 'grid w-full min-w-0 grid-cols-5 gap-x-0.5 text-center'
  return (
    <div
      className="flex w-full min-w-0 flex-col justify-center gap-0"
      role="group"
      aria-label="Characteristics (MARIP)"
    >
      <div
        className={`${track} pb-0.5 text-[0.55rem] uppercase tracking-wide text-zinc-300 sm:text-[0.6rem]`}
      >
        {MARIP_HEADERS.map(({ letter, title }) => (
          <span key={letter} title={title}>
            {letter}
          </span>
        ))}
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-xs text-zinc-50 sm:text-sm`}>
        {values === null
          ? MARIP_HEADERS.map(({ letter }) => (
              <span key={`${letter}-val`} className="text-zinc-400">
                —
              </span>
            ))
          : values.map((v, i) => <span key={i}>{v}</span>)}
      </div>
    </div>
  )
}
