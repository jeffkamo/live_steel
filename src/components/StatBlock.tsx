import type { MonsterFeature, PowerRollEffect } from '../types'
import type { BestiaryStatblock } from '../bestiary'
import { lookupStatblock } from '../bestiary'
import { DRAW_STEEL_TIER_GLYPHS, keywordDrawSteelGlyph } from '../drawSteelGlyphs'

/** Shared stat-block panel finish (gradient + inner highlight) */
const statBlockVeneerClass =
  'bg-[linear-gradient(165deg,rgb(39_39_42/0.95)_0%,rgb(9_9_11/0.98)_55%)] shadow-[inset_0_1px_0_rgb(251_191_36/0.07)]'

function CoreStatsHeader({ sb }: { sb: BestiaryStatblock }) {
  const labelClass = 'text-[0.6rem] font-semibold uppercase tracking-wider text-amber-200/55'
  const valueClass = 'text-xs tabular-nums text-zinc-100'
  const maripLetters = ['M', 'A', 'R', 'I', 'P'] as const
  const maripValues = [sb.might, sb.agility, sb.reason, sb.intuition, sb.presence]

  return (
    <div
      className={`space-y-2 rounded-md border border-amber-950/55 border-l-2 border-l-amber-700/45 bg-zinc-950/35 px-3 py-2.5 ${statBlockVeneerClass}`}
      data-testid="core-stats-header"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-amber-100/85">
          {sb.ancestry.join(' · ')}
        </span>
        <span className="text-[0.6rem] text-amber-200/45">
          EV {sb.ev}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <div>
          <div className={labelClass}>Stamina</div>
          <div className={`${valueClass} font-draw-steel text-sm text-amber-50/95`}>{sb.stamina}</div>
        </div>
        <div>
          <div className={labelClass}>Speed</div>
          <div className={valueClass}>
            <span className="font-draw-steel text-sm text-amber-50/95">{sb.speed}</span>
            {sb.movement ? (
              <span className="text-zinc-200"> ({sb.movement})</span>
            ) : null}
          </div>
        </div>
        <div>
          <div className={labelClass}>Size</div>
          <div className={`${valueClass} font-draw-steel text-sm`}>{sb.size}</div>
        </div>
        <div>
          <div className={labelClass}>Stability</div>
          <div className={`${valueClass} font-draw-steel text-sm text-amber-50/95`}>{sb.stability}</div>
        </div>
        <div>
          <div className={labelClass}>Free Strike</div>
          <div className={`${valueClass} font-draw-steel text-sm text-amber-50/95`}>{sb.free_strike}</div>
        </div>
      </div>

      <div>
        <div className={`${labelClass} mb-0.5`}>M / A / R / I / P</div>
        <div className="flex flex-wrap items-baseline gap-x-1 text-xs tabular-nums text-zinc-100">
          {maripLetters.map((letter, i) => (
            <span key={letter} className="inline-flex items-baseline gap-0.5">
              <span
                className="font-draw-steel text-sm text-amber-200/90"
                data-testid="draw-steel-marip-letter"
              >
                {letter}
              </span>
              <span
                className="font-draw-steel text-[0.8rem] text-zinc-100"
                data-testid="draw-steel-marip-num"
              >
                {maripValues[i]}
              </span>
              {i < maripLetters.length - 1 && <span className="mx-0.5 text-zinc-600">/</span>}
            </span>
          ))}
        </div>
      </div>

      {(sb.immunities?.length || sb.weaknesses?.length || sb.with_captain) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.68rem]">
          {sb.immunities && sb.immunities.length > 0 && (
            <span>
              <span className="font-semibold text-amber-200/50">Immunities</span>{' '}
              <span className="text-zinc-300">{sb.immunities.join(', ')}</span>
            </span>
          )}
          {sb.weaknesses && sb.weaknesses.length > 0 && (
            <span>
              <span className="font-semibold text-amber-200/50">Weaknesses</span>{' '}
              <span className="text-zinc-300">{sb.weaknesses.join(', ')}</span>
            </span>
          )}
          {sb.with_captain && (
            <span>
              <span className="font-semibold text-amber-200/50">With Captain</span>{' '}
              <span className="text-zinc-300">{sb.with_captain}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function PowerRollTiers({ effect }: { effect: PowerRollEffect }) {
  if (!effect.roll) return null
  const tiers: { band: string; tierIdx: 0 | 1 | 2; text: string | undefined }[] = [
    { band: '11−', tierIdx: 0, text: effect.tier1 },
    { band: '12–16', tierIdx: 1, text: effect.tier2 },
    { band: '17+', tierIdx: 2, text: effect.tier3 },
  ]
  return (
    <div className="mt-1 overflow-hidden rounded border border-amber-950/50 bg-zinc-950/55 text-[0.68rem] leading-relaxed">
      <div className="border-b border-amber-950/40 bg-zinc-900/50 px-2 py-1 font-semibold text-amber-100/90">
        {effect.roll}
      </div>
      {tiers.map(({ band, tierIdx, text }) =>
        text ? (
          <div
            key={band}
            className="flex gap-2 border-b border-zinc-800/60 px-2 py-0.5 last:border-b-0"
          >
            <span
              className="font-draw-steel w-5 shrink-0 text-center text-base leading-none text-amber-200/95"
              aria-label={`Tier ${tierIdx + 1}`}
              data-testid="draw-steel-tier-glyph"
            >
              {DRAW_STEEL_TIER_GLYPHS[tierIdx]}
            </span>
            <span className="shrink-0 font-semibold text-amber-200/50">{band}</span>
            <span className="text-zinc-300">{text}</span>
          </div>
        ) : null,
      )}
    </div>
  )
}

function KeywordGlyphs({ keywords }: { keywords: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {keywords.map((kw) => {
        const g = keywordDrawSteelGlyph(kw)
        if (!g) {
          return (
            <span
              key={kw}
              className="rounded border border-zinc-600/45 bg-zinc-900/55 px-1.5 py-0.5 text-zinc-300"
            >
              {kw}
            </span>
          )
        }
        return (
          <span
            key={kw}
            className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-amber-800/45 bg-amber-950/35 px-1 font-draw-steel text-[0.95rem] leading-none text-amber-100"
            role="img"
            aria-label={kw}
            data-testid="draw-steel-keyword-glyph"
            data-keyword={kw}
          >
            {g}
          </span>
        )
      })}
    </span>
  )
}

function FeatureCard({ feature }: { feature: MonsterFeature }) {
  const isAbility = feature.feature_type === 'ability'

  return (
    <div
      className={`rounded-md border border-amber-950/40 bg-zinc-900/40 px-3 py-2 ${statBlockVeneerClass}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {feature.icon && (
          <span className="text-sm" aria-hidden>
            {feature.icon}
          </span>
        )}
        <span className="font-semibold text-amber-50/95">{feature.name}</span>
        {feature.ability_type && (
          <span className="text-[0.65rem] font-medium tracking-wide text-amber-200/45">
            {feature.ability_type}
          </span>
        )}
        {feature.cost && (
          <span className="rounded-full border border-amber-800/40 bg-amber-950/30 px-1.5 py-0 text-[0.6rem] font-semibold text-amber-100/90">
            {feature.cost}
          </span>
        )}
      </div>
      {isAbility && (feature.keywords?.length || feature.usage || feature.distance || feature.target) && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.68rem] text-zinc-400">
          {feature.keywords && feature.keywords.length > 0 && (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-amber-200/50">Keywords</span>
              <KeywordGlyphs keywords={feature.keywords} />
            </span>
          )}
          {feature.usage && (
            <span>
              <span className="font-semibold text-amber-200/50">Type</span> {feature.usage}
            </span>
          )}
          {feature.distance && (
            <span>
              <span className="font-semibold text-amber-200/50">Distance</span> {feature.distance}
            </span>
          )}
          {feature.target && (
            <span>
              <span className="font-semibold text-amber-200/50">Target</span> {feature.target}
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
  const statblock = lookupStatblock(monsterName)

  if (features.length === 0 && !statblock) {
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
      data-testid="stat-block-root"
    >
      {statblock && <CoreStatsHeader sb={statblock} />}
      {abilities.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
            Abilities
          </h4>
          {abilities.map((f, i) => (
            <FeatureCard key={`ability-${i}`} feature={f} />
          ))}
        </div>
      )}
      {traits.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
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
