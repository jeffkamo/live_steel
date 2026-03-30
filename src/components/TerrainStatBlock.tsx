import { lookupTerrain, terrainFeatures, type TerrainStatblock } from '../terrainBestiary'
import { FeatureList } from './StatBlock'

function TerrainCoreStats({ sb }: { sb: TerrainStatblock }) {
  const statValueClass = 'text-base font-medium tabular-nums leading-tight text-zinc-100'
  const statLabelClass = 'mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500'

  return (
    <div data-testid="terrain-core-stats">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-300">
          {sb.featureblock_type}
        </span>
        <span className="text-[0.65rem] text-zinc-400">
          Level {sb.level} · EV {sb.ev}
        </span>
      </div>

      {sb.flavor && (
        <p className="mt-2 text-[0.72rem] leading-snug text-zinc-400 italic">
          {sb.flavor}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-center">
        <div>
          <div className={statValueClass}>{sb.stamina}</div>
          <div className={statLabelClass}>Stamina</div>
        </div>
        <div>
          <div className={statValueClass}>{sb.size}</div>
          <div className={statLabelClass}>Size</div>
        </div>
      </div>

      {sb.stats && sb.stats.length > 0 && (
        <div className="mt-3 space-y-1">
          {sb.stats.map((stat) => (
            <div key={stat.name} className="text-[0.72rem] leading-snug text-zinc-300">
              <span className="font-medium text-zinc-400">{stat.name}: </span>
              {stat.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TerrainStatBlock({ terrainName }: { terrainName: string }) {
  const sb = lookupTerrain(terrainName)
  const features = terrainFeatures(terrainName)

  if (!sb && features.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-zinc-500">
        No terrain data available.
      </p>
    )
  }

  return (
    <div role="region" aria-label={`Stat block for ${terrainName}`} className="py-2">
      <div className="rounded-md border border-amber-950/55 border-l-2 border-l-amber-700/45 bg-[linear-gradient(165deg,rgb(39_39_42/0.95)_0%,rgb(9_9_11/0.98)_55%)] px-3 pt-2.5 pb-3 shadow-[inset_0_1px_0_rgb(251_191_36/0.07)]">
        {sb && <TerrainCoreStats sb={sb} />}
        {sb && features.length > 0 && (
          <div className="mt-3 border-t border-zinc-700/40 pt-3">
            <FeatureList features={features} />
          </div>
        )}
        {!sb && features.length > 0 && <FeatureList features={features} />}
      </div>
    </div>
  )
}
