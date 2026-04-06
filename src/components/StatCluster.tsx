const captainStatCellHighlight =
  'rounded-sm px-0.5 ring-1 ring-amber-500/45 bg-amber-100/90 dark:bg-amber-500/15 dark:ring-amber-400/40'

export function StatCluster({
  fs,
  spd,
  stab,
  highlightFs = false,
  highlightSpd = false,
  highlightStab = false,
}: {
  fs: number
  spd: number
  stab: number
  highlightFs?: boolean
  highlightSpd?: boolean
  highlightStab?: boolean
}) {
  const track = 'grid w-full min-w-0 grid-cols-3 gap-x-1 text-center'
  return (
    <div className="flex w-full min-w-0 flex-col justify-center gap-0">
      <div className={`${track} pb-0.5 text-[0.6rem] uppercase tracking-wide text-zinc-600 dark:text-zinc-300`}>
        <span title="Free strike">FS</span>
        <span title="Speed">SPD</span>
        <span title="Stability">Stab</span>
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-sm text-zinc-900 dark:text-zinc-50`}>
        <span data-testid={highlightFs ? 'stat-cluster-fs-captain' : undefined} className={highlightFs ? captainStatCellHighlight : undefined}>
          {fs}
        </span>
        <span data-testid={highlightSpd ? 'stat-cluster-spd-captain' : undefined} className={highlightSpd ? captainStatCellHighlight : undefined}>
          {spd}
        </span>
        <span data-testid={highlightStab ? 'stat-cluster-stab-captain' : undefined} className={highlightStab ? captainStatCellHighlight : undefined}>
          {stab}
        </span>
      </div>
    </div>
  )
}
