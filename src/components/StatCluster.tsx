export function StatCluster({ fs, dist, stab }: { fs: number; dist: number; stab: number }) {
  const track = 'grid w-full min-w-0 grid-cols-3 gap-x-1 text-center'
  return (
    <div className="flex w-full min-w-0 flex-col justify-center gap-0">
      <div className={`${track} pb-0.5 text-[0.6rem] uppercase tracking-wide text-zinc-300`}>
        <span title="Free strike">FS</span>
        <span title="Distance">Dist</span>
        <span title="Stability">Stab</span>
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-sm text-zinc-50`}>
        <span>{fs}</span>
        <span>{dist}</span>
        <span>{stab}</span>
      </div>
    </div>
  )
}
