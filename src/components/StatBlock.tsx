import type { MonsterFeature, PowerRollEffect } from '../types'

function PowerRollTiers({ effect }: { effect: PowerRollEffect }) {
  if (!effect.roll) return null
  return (
    <div className="mt-1 rounded border border-zinc-700/60 bg-zinc-950/40 text-[0.68rem] leading-relaxed">
      <div className="border-b border-zinc-700/50 px-2 py-1 font-semibold text-zinc-200">
        {effect.roll}
      </div>
      {effect.tier1 && (
        <div className="flex gap-2 border-b border-zinc-800/60 px-2 py-0.5">
          <span className="shrink-0 font-semibold text-zinc-400">11−</span>
          <span className="text-zinc-300">{effect.tier1}</span>
        </div>
      )}
      {effect.tier2 && (
        <div className="flex gap-2 border-b border-zinc-800/60 px-2 py-0.5">
          <span className="shrink-0 font-semibold text-zinc-400">12–16</span>
          <span className="text-zinc-300">{effect.tier2}</span>
        </div>
      )}
      {effect.tier3 && (
        <div className="flex gap-2 px-2 py-0.5">
          <span className="shrink-0 font-semibold text-zinc-400">17+</span>
          <span className="text-zinc-300">{effect.tier3}</span>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ feature }: { feature: MonsterFeature }) {
  const isAbility = feature.feature_type === 'ability'

  return (
    <div className="rounded-md border border-zinc-700/50 bg-zinc-800/40 px-3 py-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {feature.icon && (
          <span className="text-sm" aria-hidden>
            {feature.icon}
          </span>
        )}
        <span className="font-semibold text-zinc-100">{feature.name}</span>
        {feature.ability_type && (
          <span className="text-[0.65rem] font-medium tracking-wide text-zinc-400">
            {feature.ability_type}
          </span>
        )}
        {feature.cost && (
          <span className="rounded-full border border-zinc-600/60 px-1.5 py-0 text-[0.6rem] font-semibold text-zinc-300">
            {feature.cost}
          </span>
        )}
      </div>
      {isAbility && (feature.keywords?.length || feature.usage || feature.distance || feature.target) && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.68rem] text-zinc-400">
          {feature.keywords && feature.keywords.length > 0 && (
            <span>
              <span className="font-semibold text-zinc-500">Keywords</span>{' '}
              {feature.keywords.join(', ')}
            </span>
          )}
          {feature.usage && (
            <span>
              <span className="font-semibold text-zinc-500">Type</span> {feature.usage}
            </span>
          )}
          {feature.distance && (
            <span>
              <span className="font-semibold text-zinc-500">Distance</span> {feature.distance}
            </span>
          )}
          {feature.target && (
            <span>
              <span className="font-semibold text-zinc-500">Target</span> {feature.target}
            </span>
          )}
        </div>
      )}
      {feature.effects && feature.effects.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {feature.effects.map((eff, i) => {
            if (eff.roll) {
              return <PowerRollTiers key={i} effect={eff} />
            }
            if (eff.effect) {
              return (
                <p key={i} className="text-[0.72rem] leading-snug text-zinc-300">
                  {eff.name && (
                    <span className="font-semibold text-zinc-200">{eff.name}. </span>
                  )}
                  {eff.effect}
                </p>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}

export function StatBlock({
  features,
  monsterName,
}: {
  features: MonsterFeature[]
  monsterName: string
}) {
  if (features.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-zinc-500" data-testid="stat-block-empty">
        No features available.
      </p>
    )
  }

  const abilities = features.filter((f) => f.feature_type === 'ability')
  const traits = features.filter((f) => f.feature_type === 'trait')

  return (
    <div
      className="flex flex-col gap-2 py-2"
      role="region"
      aria-label={`Stat block for ${monsterName}`}
    >
      {abilities.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">
            Abilities
          </h4>
          {abilities.map((f, i) => (
            <FeatureCard key={`ability-${i}`} feature={f} />
          ))}
        </div>
      )}
      {traits.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-500">
            Traits
          </h4>
          {traits.map((f, i) => (
            <FeatureCard key={`trait-${i}`} feature={f} />
          ))}
        </div>
      )}
    </div>
  )
}
