import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react'
import type { MonsterFeature, PowerRollEffect } from '../types'
import type { BestiaryStatblock } from '../bestiary'
import { lookupStatblock } from '../bestiary'
import { GROUP_COLOR_STAT_BLOCK_CARD } from '../data'
import type { GroupColorId } from '../types'
import {
  DRAW_STEEL_DISTANCE_RULER_GLYPH,
  DRAW_STEEL_TIER_GLYPHS,
  featureIconToDrawSteelGlyph,
  keywordDrawSteelGlyph,
} from '../drawSteelGlyphs'

/** Shared stat-block panel finish (gradient + inner highlight) */
const statBlockVeneerClass =
  'bg-[linear-gradient(165deg,rgb(39_39_42/0.95)_0%,rgb(9_9_11/0.98)_55%)] shadow-[inset_0_1px_0_rgb(251_191_36/0.07)]'

const statBlockCardBaseClass = `rounded-md bg-zinc-950/35 px-3 pt-2.5 pb-6 ${statBlockVeneerClass}`
const statBlockCardBorderDefault =
  'border border-amber-950/55 border-l-2 border-l-amber-700/45'

const STAT_BLOCK_SEP_BAND_H_PX = 16
const SEP_MID_Y = 7
const SEP_DROP = 8
const SEP_HALF_V = 10

function StatBlockSeparator() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [widthPx, setWidthPx] = useState(0)
  const gradId = useId().replace(/:/g, '')

  useLayoutEffect(() => {
    const el = svgRef.current
    if (!el) return
    const measure = () => {
      const fromSvg = el.getBoundingClientRect().width
      const fromParent = el.parentElement?.getBoundingClientRect().width ?? 0
      setWidthPx(Math.max(fromSvg, fromParent))
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const RO = globalThis.ResizeObserver
    const ro = RO ? new RO(measure) : null
    ro?.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
    }
  }, [])

  const cx = widthPx / 2
  const d =
    widthPx > 0
      ? `M0 ${SEP_MID_Y}L${cx - SEP_HALF_V} ${SEP_MID_Y}L${cx} ${SEP_MID_Y + SEP_DROP}L${cx + SEP_HALF_V} ${SEP_MID_Y}L${widthPx} ${SEP_MID_Y}`
      : ''

  return (
    <div className="py-2.5" aria-hidden>
      <svg
        ref={svgRef}
        className="block h-4 w-full min-w-0"
        height={STAT_BLOCK_SEP_BAND_H_PX}
        viewBox={widthPx > 0 ? `0 0 ${widthPx} ${STAT_BLOCK_SEP_BAND_H_PX}` : `0 0 1 ${STAT_BLOCK_SEP_BAND_H_PX}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2={widthPx || 1} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgb(113 113 122 / 0)" />
            <stop offset="18%" stopColor="rgb(113 113 122 / 0.45)" />
            <stop offset="82%" stopColor="rgb(113 113 122 / 0.45)" />
            <stop offset="100%" stopColor="rgb(113 113 122 / 0)" />
          </linearGradient>
        </defs>
        {d ? (
          <path
            d={d}
            stroke={`url(#${gradId})`}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="butt"
            strokeLinejoin="miter"
          />
        ) : null}
      </svg>
    </div>
  )
}

function formatSigned(n: number): string {
  if (n > 0) return `+${n}`
  return String(n)
}

function immunityWeaknessLine(sb: BestiaryStatblock): { immunity: string; weakness: string } {
  const immunity =
    sb.immunities && sb.immunities.length > 0 ? sb.immunities.join(', ') : '—'
  const weakness =
    sb.weaknesses && sb.weaknesses.length > 0 ? sb.weaknesses.join(', ') : '—'
  return { immunity, weakness }
}

function extractPowerRollBonus(effects: PowerRollEffect[] | undefined): string | undefined {
  if (!effects) return undefined
  for (const e of effects) {
    if (!e.roll) continue
    const m = e.roll.match(/\+\s*(\d+)/)
    if (m) return `+ ${m[1]}`
  }
  return undefined
}

function rangeGlyphForDistance(distance: string): string | undefined {
  if (!distance.trim()) return undefined
  return DRAW_STEEL_DISTANCE_RULER_GLYPH
}

function CoreStatsSection({ sb }: { sb: BestiaryStatblock }) {
  const statValueClass = 'text-base font-medium tabular-nums leading-tight text-zinc-100'
  const statLabelClass =
    'mt-1 text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500'

  const { immunity, weakness } = immunityWeaknessLine(sb)

  const maripRow: { letter: string; title: string; value: number }[] = [
    { letter: 'M', title: 'Might', value: sb.might },
    { letter: 'A', title: 'Agility', value: sb.agility },
    { letter: 'R', title: 'Reason', value: sb.reason },
    { letter: 'I', title: 'Intuition', value: sb.intuition },
    { letter: 'P', title: 'Presence', value: sb.presence },
  ]

  return (
    <div data-testid="core-stats-header">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-300">
          {sb.ancestry.join(' · ')}
        </span>
        <span className="text-[0.65rem] text-zinc-400">EV {sb.ev}</span>
      </div>

      <StatBlockSeparator />

      <div className="grid grid-cols-5 gap-x-2 gap-y-2 text-center sm:gap-x-3">
        <div>
          <div className={statValueClass}>{sb.size}</div>
          <div className={statLabelClass}>Size</div>
        </div>
        <div>
          <div className={statValueClass}>{sb.speed}</div>
          <div className={statLabelClass}>Speed</div>
        </div>
        <div>
          <div className={statValueClass}>{sb.stamina}</div>
          <div className={statLabelClass}>Stamina</div>
        </div>
        <div>
          <div className={statValueClass}>{sb.stability}</div>
          <div className={statLabelClass}>Stability</div>
        </div>
        <div>
          <div className={statValueClass}>{sb.free_strike}</div>
          <div className={statLabelClass}>Free Strike</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-[0.72rem] leading-snug text-zinc-300">
        <span>
          <span className="font-medium text-zinc-400">Immunity: </span>
          {immunity}
        </span>
        <span>
          <span className="font-medium text-zinc-400">Weakness: </span>
          {weakness}
        </span>
      </div>
      <div className="mt-1 text-[0.72rem] text-zinc-300">
        <span className="font-medium text-zinc-400">Movement: </span>
        {sb.movement ?? '—'}
      </div>

      <StatBlockSeparator />

      <div className="grid w-full min-w-0 grid-cols-5 gap-x-1 sm:gap-x-1.5">
        {maripRow.map(({ letter, title, value }) => {
          const signed = formatSigned(value)
          return (
            <div
              key={letter}
              title={title}
              className="flex min-w-0 items-center justify-start gap-1.5 whitespace-nowrap"
              aria-label={`${title} ${signed}`}
            >
              <span
                className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded border border-zinc-600/50 bg-zinc-950/80 font-draw-steel text-sm text-zinc-300"
                data-testid="draw-steel-marip-letter"
                aria-hidden
              >
                {letter}
              </span>
              <span className="tabular-nums text-sm text-zinc-200" data-testid="draw-steel-marip-num">
                {signed}
              </span>
            </div>
          )
        })}
      </div>

      {sb.with_captain && (
        <div className="mt-2 text-[0.68rem]">
          <span className="font-medium text-zinc-400">With Captain: </span>
          <span className="text-zinc-300">{sb.with_captain}</span>
        </div>
      )}
    </div>
  )
}

function PowerRollTiers({ effect }: { effect: PowerRollEffect }) {
  if (!effect.roll) return null
  const tiers: { band: string; tierIdx: 0 | 1 | 2; text: string | undefined }[] = [
    { band: '≤11', tierIdx: 0, text: effect.tier1 },
    { band: '12–16', tierIdx: 1, text: effect.tier2 },
    { band: '17+', tierIdx: 2, text: effect.tier3 },
  ]
  return (
    <div className="mt-2">
      <div className="mb-1 text-[0.65rem] font-semibold tracking-wide text-zinc-400">{effect.roll}</div>
      <div className="grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-2 gap-y-1 text-[0.72rem] leading-snug">
        {tiers.map(({ band, tierIdx, text }) =>
          text ? (
            <Fragment key={tierIdx}>
              <div className="flex min-w-0 justify-start">
                <span
                  className="inline-block font-draw-steel text-xl leading-none text-zinc-400 sm:text-2xl"
                  aria-label={`Tier ${tierIdx + 1} (${band})`}
                  data-testid="draw-steel-tier-glyph"
                >
                  {DRAW_STEEL_TIER_GLYPHS[tierIdx]}
                </span>
              </div>
              <span className="min-w-0 text-zinc-300">{text}</span>
            </Fragment>
          ) : null,
        )}
      </div>
    </div>
  )
}

function StatBlockFeatureIcon({ icon }: { icon?: string }) {
  if (!icon) return null
  const g = featureIconToDrawSteelGlyph(icon)
  if (g) {
    return (
      <span
        className="font-draw-steel text-lg leading-none text-zinc-300"
        data-testid="stat-block-feature-glyph"
      >
        {g}
      </span>
    )
  }
  return (
    <span className="text-lg leading-none" data-testid="stat-block-feature-fallback">
      {icon}
    </span>
  )
}

function KeywordLine({ keywords }: { keywords: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1 text-zinc-200">
      {keywords.map((kw, i) => (
        <span key={`${kw}-${i}`} className="inline-flex items-baseline">
          {i > 0 ? <span className="text-zinc-600">, </span> : null}
          {kw}
        </span>
      ))}
    </span>
  )
}

function AbilityBlock({ feature }: { feature: MonsterFeature }) {
  const rollBonus = extractPowerRollBonus(feature.effects)
  const rangeG = feature.distance ? rangeGlyphForDistance(feature.distance) : undefined
  const targetG = keywordDrawSteelGlyph('targets')

  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-0 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
      <div className="flex justify-center pt-0.5 text-lg leading-none" aria-hidden>
        <StatBlockFeatureIcon icon={feature.icon} />
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <div className="min-w-0">
            <span className="font-semibold text-zinc-100">{feature.name}</span>
            {rollBonus ? (
              <span className="ml-1.5 text-sm tabular-nums text-zinc-400">{rollBonus}</span>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-[0.65rem] font-medium text-zinc-500">
            {feature.ability_type ? <div>{feature.ability_type}</div> : null}
            {feature.cost ? <div className="mt-0.5 text-zinc-400">{feature.cost}</div> : null}
          </div>
        </div>

        {(feature.keywords?.length || feature.usage) && (
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[0.68rem]">
            <div className="min-w-0 text-zinc-300">
              {feature.keywords && feature.keywords.length > 0 ? (
                <KeywordLine keywords={feature.keywords} />
              ) : null}
            </div>
            {feature.usage ? <span className="shrink-0 text-right text-zinc-400">{feature.usage}</span> : null}
          </div>
        )}

        {(feature.distance || feature.target) && (
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[0.68rem]">
            <span className="inline-flex min-w-0 items-baseline gap-1.5 text-zinc-300">
              {feature.distance && rangeG ? (
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center font-draw-steel text-[0.9rem] leading-none text-zinc-400"
                  aria-hidden
                >
                  {rangeG}
                </span>
              ) : null}
              {feature.distance ? <span>{feature.distance}</span> : null}
            </span>
            {feature.target ? (
              <span className="inline-flex max-w-[min(100%,18rem)] items-baseline justify-end gap-1.5 text-right text-zinc-300">
                {targetG ? (
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center font-draw-steel text-[0.9rem] leading-none text-zinc-400"
                    aria-hidden
                  >
                    {targetG}
                  </span>
                ) : null}
                <span>{feature.target}</span>
              </span>
            ) : null}
          </div>
        )}

        {feature.effects && feature.effects.length > 0 && (
          <div className="space-y-1 pt-0.5">
            {feature.effects.map((eff, i) => {
              if (eff.roll) {
                return <PowerRollTiers key={i} effect={eff} />
              }
              if (eff.effect) {
                return (
                  <p key={i} className="text-[0.72rem] leading-snug text-zinc-300">
                    {eff.name ? (
                      <span className="font-semibold text-zinc-200">{eff.name}.</span>
                    ) : null}
                    {eff.name ? ' ' : null}
                    {eff.effect}
                  </p>
                )
              }
              return null
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TraitBlock({ feature }: { feature: MonsterFeature }) {
  const body =
    feature.effects?.map((e) => e.effect).filter(Boolean).join(' ') ?? ''

  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
      <div className="flex justify-center pt-0.5 text-lg leading-none" aria-hidden>
        <StatBlockFeatureIcon icon={feature.icon} />
      </div>
      <p className="min-w-0 text-[0.72rem] leading-snug text-zinc-300">
        <span className="font-semibold text-zinc-100">{feature.name}</span>
        {body ? (
          <>
            {' '}
            {body}
          </>
        ) : null}
      </p>
    </div>
  )
}

export function StatBlock({
  features,
  monsterName,
  encounterGroupColor,
}: {
  features: MonsterFeature[]
  monsterName: string
  /** When set (e.g. monster drawer), card border matches encounter group color. */
  encounterGroupColor?: GroupColorId
}) {
  const statblock = lookupStatblock(monsterName)
  const statCardBorderClass =
    encounterGroupColor != null
      ? GROUP_COLOR_STAT_BLOCK_CARD[encounterGroupColor]
      : statBlockCardBorderDefault

  if (features.length === 0 && !statblock) {
    return (
      <p className="py-2 text-center text-xs text-zinc-500" data-testid="stat-block-empty">
        No features available.
      </p>
    )
  }

  const abilities = features.filter((f) => f.feature_type === 'ability')
  const traits = features.filter((f) => f.feature_type === 'trait')
  const hasFeatures = abilities.length > 0 || traits.length > 0

  return (
    <div
      className="py-2"
      role="region"
      aria-label={`Stat block for ${monsterName}`}
      data-testid="stat-block-root"
    >
      <div
        className={
          statblock || hasFeatures ? `${statBlockCardBaseClass} ${statCardBorderClass}` : ''
        }
      >
        {statblock && <CoreStatsSection sb={statblock} />}

        {statblock && hasFeatures && <StatBlockSeparator />}

        {abilities.map((f, i) => (
          <div key={`ability-${i}`}>
            {i > 0 && <StatBlockSeparator />}
            <AbilityBlock feature={f} />
          </div>
        ))}

        {traits.map((f, i) => (
          <div key={`trait-${i}`}>
            {((abilities.length > 0 && i === 0) || i > 0) && <StatBlockSeparator />}
            <TraitBlock feature={f} />
          </div>
        ))}
      </div>
    </div>
  )
}
