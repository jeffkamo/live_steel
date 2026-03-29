import type {
  ConditionEntry,
  EncounterGroup,
  EncounterGroupSeed,
  GroupColorId,
  Marip,
  MinionEntry,
  Monster,
  MonsterFeature,
  MonsterSeed,
  TerrainRowSeed,
  TerrainRowState,
} from './types'
import { bestiarySubtitle, deriveInitials, featuresForMonster, lookupStatblock, type BestiaryStatblock } from './bestiary'

export const GROUP_COLOR_ORDER: readonly GroupColorId[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'white',
  'grey',
  'black',
] as const

export const GROUP_COLOR_LABEL: Record<GroupColorId, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  white: 'White',
  grey: 'Grey',
  black: 'Black',
}

/** Tailwind class bundles for creature ordinal rings (full strings for the compiler). */
export const GROUP_COLOR_BADGE: Record<
  GroupColorId,
  { border: string; bg: string; text: string }
> = {
  red: {
    border: 'border-red-500/90',
    bg: 'bg-red-950/55',
    text: 'text-red-100',
  },
  orange: {
    border: 'border-orange-500/90',
    bg: 'bg-orange-950/55',
    text: 'text-orange-100',
  },
  yellow: {
    border: 'border-yellow-400/90',
    bg: 'bg-yellow-950/45',
    text: 'text-yellow-100',
  },
  green: {
    border: 'border-emerald-500/90',
    bg: 'bg-emerald-950/55',
    text: 'text-emerald-100',
  },
  blue: {
    border: 'border-sky-500/90',
    bg: 'bg-sky-950/55',
    text: 'text-sky-100',
  },
  purple: {
    border: 'border-violet-500/90',
    bg: 'bg-violet-950/55',
    text: 'text-violet-100',
  },
  pink: {
    border: 'border-pink-500/90',
    bg: 'bg-pink-950/55',
    text: 'text-pink-100',
  },
  white: {
    border: 'border-zinc-100/90',
    bg: 'bg-zinc-100/15',
    text: 'text-zinc-50',
  },
  grey: {
    border: 'border-zinc-400/90',
    bg: 'bg-zinc-800/65',
    text: 'text-zinc-200',
  },
  black: {
    border: 'border-zinc-600/95',
    bg: 'bg-black/80',
    text: 'text-zinc-300',
  },
}

export const GROUP_COLOR_PREVIEW_HEX: Record<GroupColorId, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#0ea5e9',
  purple: '#8b5cf6',
  pink: '#ec4899',
  white: '#f4f4f5',
  grey: '#a1a1aa',
  black: '#18181b',
}

export const ENCOUNTER_GROUPS: readonly EncounterGroupSeed[] = [
  {
    monsters: [
      {
        name: 'Goblin Assassin 1',
        subtitle: 'Level 1 Horde · Ambusher',
        initials: 'GA',
        stamina: [5, 15],
        marip: [-2, 2, 0, 0, -2],
        fs: -1,
        dist: 4,
        stab: 0,
        conditions: ['Weakened', 'Slowed'],
      },
      {
        name: 'Goblin Raider',
        subtitle: 'Level 1 Horde · Skirmisher',
        initials: 'GR',
        stamina: [8, 12],
        marip: [0, 1, 0, 0, 0],
        fs: 0,
        dist: 5,
        stab: 0,
        conditions: ['Grabbed'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Goblin Underboss',
        subtitle: 'Level 2 Solo · Commander',
        initials: 'GU',
        stamina: [22, 22],
        marip: [0, 1, 1, 0, 1],
        fs: 2,
        dist: 5,
        stab: 1,
        conditions: ['Judged'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Minions',
        subtitle: 'Horde · Captain: Goblin Assassin 1',
        initials: 'M',
        stamina: [20, 20],
        marip: [-1, 0, 0, 0, -1],
        fs: 0,
        dist: 3,
        stab: 0,
        conditions: ['Taunted'],
        minions: [
          { name: 'Goblin Spinecleaver 1', initials: 'GS1', conditions: [] },
          { name: 'Goblin Spinecleaver 2', initials: 'GS2', conditions: ['Bleeding'] },
          { name: 'Goblin Spinecleaver 3', initials: 'GS3', conditions: [] },
          { name: 'Goblin Spinecleaver 4', initials: 'GS4', conditions: [] },
        ],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Ironwood Sentinel',
        subtitle: 'Level 3 Elite · Bruiser',
        initials: 'IS',
        stamina: [8, 24],
        marip: [2, -1, 0, 1, 2],
        fs: 1,
        dist: 2,
        stab: 2,
        conditions: ['Bleeding', 'Dazed'],
      },
      {
        name: 'Arcane Echo',
        subtitle: 'Level 2 Horde · Caster',
        initials: 'AE',
        stamina: [3, 10],
        marip: [1, 3, 2, 0, 1],
        fs: 3,
        dist: 6,
        stab: -1,
        conditions: ['Restrained'],
      },
      {
        name: 'Reserve slot',
        subtitle: 'Drop-in threat or hazard',
        initials: '—',
        stamina: [0, 0],
        marip: null,
        fs: 0,
        dist: 0,
        stab: 0,
        conditions: [],
      },
    ],
  },
] as const

export const TERRAIN_ROWS: readonly TerrainRowSeed[] = [
  {
    object: 'Toppled barricade — light cover along the eastern lane.',
    stamina: [6, 8] as const,
    note: 'Burning; end of round 1d4 to adjacent.',
    conditions: ['Slowed', 'Weakened'],
  },
  {
    object: 'Ritual circle (inactive). Chalk smeared, runes still warm.',
    stamina: [0, 0] as const,
    note: 'Anyone ending turn inside tests Stability (15+).',
    conditions: ['Marked'],
  },
] as const

/** Master list for the add-condition picker (sorted for stable UI). */
export const CONDITION_CATALOG: readonly string[] = [
  'Bleeding',
  'Dazed',
  'Frightened',
  'Grabbed',
  'Judged',
  'Marked',
  'Prone',
  'Restrained',
  'Slowed',
  'Surprised',
  'Taunted',
  'Weakened',
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

export const MARIP_HEADERS = [
  { letter: 'M', title: 'Might' },
  { letter: 'A', title: 'Agility' },
  { letter: 'R', title: 'Reason' },
  { letter: 'I', title: 'Intuition' },
  { letter: 'P', title: 'Presence' },
] as const

/** 6 columns: group | creatures (shrinks first) | stamina | MARIP | FS/Dist/Stab | conditions (width = icon row) */
export const ROSTER_GRID_TEMPLATE =
  '5.5rem minmax(0,1fr) minmax(5.25rem,7rem) minmax(5.75rem,7.25rem) 7.25rem max-content'

/** MIME type for HTML5 drag payload: source encounter group index (stringified). */
export const ENCOUNTER_GROUP_DRAG_MIME = 'application/x-live-steel-encounter-group-index'

export function newEncounterGroupId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `eg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Move one item from `from` to `to` in a copy of the array (inclusive indices, same semantics as splice).
 */
export function moveIndexInArray<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items]
  }
  const next = [...items]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x!)
  return next
}

/**
 * After moving the encounter group at `from` to index `to`, map an old group index to its new index.
 */
export function remapEncounterGroupIndex(from: number, to: number, oldGroupIndex: number): number {
  if (oldGroupIndex === from) return to
  if (from < to) {
    if (oldGroupIndex > from && oldGroupIndex <= to) return oldGroupIndex - 1
    return oldGroupIndex
  }
  if (oldGroupIndex >= to && oldGroupIndex < from) return oldGroupIndex + 1
  return oldGroupIndex
}

/** Reorder encounter groups and remap {@link Monster.captainId} group indices to match. */
export function reorderEncounterGroupsWithCaptainRemap(
  groups: EncounterGroup[],
  from: number,
  to: number,
): EncounterGroup[] {
  const moved = moveIndexInArray(groups, from, to)
  return moved.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      if (!m.captainId) return m
      const ref = m.captainId
      return {
        ...m,
        captainId: {
          groupIndex: remapEncounterGroupIndex(from, to, ref.groupIndex),
          monsterIndex: ref.monsterIndex,
        },
      }
    }),
  }))
}

export const terrainGridClass = 'grid grid-cols-[minmax(0,1.35fr)_minmax(4.5rem,6.5rem)_minmax(0,1.2fr)]'

export function conditionEntryFromLabel(label: string): ConditionEntry {
  return { label, state: 'neutral' }
}

export function cloneMinionEntries(
  seeds: readonly { name: string; initials: string; conditions: readonly string[]; dead?: boolean }[],
): MinionEntry[] {
  return seeds.map((s) => ({
    name: s.name,
    initials: s.initials,
    conditions: s.conditions.map(conditionEntryFromLabel),
    dead: s.dead ?? false,
  }))
}

/**
 * Resolve features for a monster seed: try the monster's own name in the bestiary first,
 * then fall back to the first minion's name (for minion groups with generic parent names
 * like "Minions"), then use inline seed features.
 */
function resolveFeatures(m: MonsterSeed): MonsterFeature[] {
  const fromName = featuresForMonster(m.name)
  if (fromName && fromName.length > 0) return fromName

  if (m.minions && m.minions.length > 0) {
    const fromMinion = featuresForMonster(m.minions[0]!.name)
    if (fromMinion && fromMinion.length > 0) return fromMinion
  }

  return m.features ? [...m.features] : []
}

export function cloneEncounterGroups(): EncounterGroup[] {
  return ENCOUNTER_GROUPS.map((group, groupIndex) => ({
    id: newEncounterGroupId(),
    color: GROUP_COLOR_ORDER[groupIndex % GROUP_COLOR_ORDER.length]!,
    monsters: group.monsters.map((m) => ({
      name: m.name,
      subtitle: m.subtitle,
      initials: m.initials,
      stamina: [m.stamina[0], m.stamina[1]] as [number, number],
      marip: m.marip === null ? null : ([...m.marip] as unknown as Marip),
      fs: m.fs,
      dist: m.dist,
      stab: m.stab,
      conditions: m.conditions.map(conditionEntryFromLabel),
      ...(m.minions ? { minions: cloneMinionEntries(m.minions) } : {}),
      features: resolveFeatures(m),
    })),
  }))
}

export function cloneTerrainRows(): TerrainRowState[] {
  return TERRAIN_ROWS.map((r) => ({
    object: r.object,
    stamina: [r.stamina[0], r.stamina[1]] as [number, number],
    note: r.note,
    conditions: r.conditions.map(conditionEntryFromLabel),
  }))
}

/**
 * Create a Monster from a bestiary entry name, with optional ordinal suffix
 * to disambiguate duplicates (e.g. "Goblin Assassin 2").
 */
export function monsterFromBestiary(bestiaryName: string, ordinalSuffix?: number): Monster {
  const sb: BestiaryStatblock | undefined = lookupStatblock(bestiaryName)
  const displayName = ordinalSuffix != null ? `${bestiaryName} ${ordinalSuffix}` : bestiaryName
  if (!sb) {
    return {
      name: displayName,
      subtitle: '',
      initials: deriveInitials(bestiaryName),
      stamina: [0, 0],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
      features: [],
    }
  }
  const stam = Number.parseInt(sb.stamina, 10)
  const stamina: [number, number] = Number.isNaN(stam) ? [0, 0] : [stam, stam]
  const features = featuresForMonster(bestiaryName) ?? []
  return {
    name: displayName,
    subtitle: bestiarySubtitle(sb),
    initials: deriveInitials(bestiaryName),
    stamina,
    marip: [sb.might, sb.agility, sb.reason, sb.intuition, sb.presence],
    fs: sb.free_strike,
    dist: sb.speed,
    stab: sb.stability,
    conditions: [],
    features,
  }
}

export function findConditionOnMonster(
  conditions: readonly ConditionEntry[],
  label: string,
): ConditionEntry | undefined {
  return conditions.find((c) => c.label === label)
}

export function conditionStateTitle(state: ConditionEntry['state']): string | undefined {
  if (state === 'eot') {
    return 'End of turn'
  }
  if (state === 'se') {
    return 'Save ends'
  }
  return undefined
}

export function conditionCatalogTooltip(label: string, active: ConditionEntry | undefined): string {
  if (active === undefined) {
    return `${label} (inactive)`
  }
  if (active.state === 'neutral') {
    return `${label} (neutral)`
  }
  const dur = conditionStateTitle(active.state)
  return dur ? `${label} (${dur})` : label
}

export function normalizeStamina(cur: number, max: number): [number, number] {
  const m = Math.max(0, Math.round(max))
  if (m === 0) {
    return [0, 0]
  }
  const c = Math.min(m, Math.max(0, Math.round(cur)))
  return [c, m]
}

export function applyStaminaDelta(current: number, max: number, delta: number): [number, number] {
  if (max === 0 && current === 0) {
    if (delta <= 0) {
      return [0, 0]
    }
    const v = Math.abs(delta)
    return [v, v]
  }
  if (max === 0) {
    return [0, 0]
  }
  return normalizeStamina(current + delta, max)
}

export function otherGroupIndexForColor(
  colorId: GroupColorId,
  encounterGroupColors: readonly GroupColorId[],
  thisGroupIndex: number,
): number | null {
  const idx = encounterGroupColors.findIndex((c, i) => i !== thisGroupIndex && c === colorId)
  return idx >= 0 ? idx : null
}

export function nextAvailableColor(usedColors: readonly GroupColorId[]): GroupColorId {
  const unused = GROUP_COLOR_ORDER.find((c) => !usedColors.includes(c))
  return unused ?? GROUP_COLOR_ORDER[usedColors.length % GROUP_COLOR_ORDER.length]!
}
