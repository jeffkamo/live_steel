import type {
  CaptainRef,
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

/**
 * Stat block card frame in the monster drawer: subtle perimeter + stronger left accent,
 * keyed to encounter group color (matches ordinal badge hue).
 */
export const GROUP_COLOR_STAT_BLOCK_CARD: Record<GroupColorId, string> = {
  red: 'border border-red-950/55 border-l-2 border-l-red-500/75',
  orange: 'border border-orange-950/55 border-l-2 border-l-orange-500/75',
  yellow: 'border border-yellow-950/50 border-l-2 border-l-yellow-400/80',
  green: 'border border-emerald-950/55 border-l-2 border-l-emerald-500/75',
  blue: 'border border-sky-950/55 border-l-2 border-l-sky-500/75',
  purple: 'border border-violet-950/55 border-l-2 border-l-violet-500/75',
  pink: 'border border-pink-950/55 border-l-2 border-l-pink-500/75',
  white: 'border border-zinc-200/25 border-l-2 border-l-zinc-100/85',
  grey: 'border border-zinc-700/70 border-l-2 border-l-zinc-400/80',
  black: 'border border-zinc-950/80 border-l-2 border-l-zinc-500/80',
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
        subtitle: 'Level 1 · Horde Ambusher',
        initials: 'GA',
        stamina: [5, 15],
        marip: [-2, 2, 0, 0, -2],
        fs: -1,
        dist: 4,
        stab: 0,
        conditions: ['Weakened', 'Slowed'],
      },
      {
        name: 'Goblin Warrior',
        subtitle: 'Level 1 · Horde Harrier',
        initials: 'GW',
        stamina: [15, 15],
        marip: [-2, 2, 0, 0, -1],
        fs: 1,
        dist: 6,
        stab: 0,
        conditions: ['Grabbed'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Goblin Underboss',
        subtitle: 'Level 1 · Horde Support',
        initials: 'GU',
        stamina: [15, 15],
        marip: [-1, 2, 0, 0, 1],
        fs: 1,
        dist: 5,
        stab: 0,
        conditions: ['Judged'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Minions',
        subtitle: 'Level 1 · Minion Brute',
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
        name: 'Minotaur Sunderer',
        subtitle: 'Level 3 · Elite Brute',
        initials: 'MS',
        stamina: [8, 120],
        marip: [2, 1, 0, 2, -1],
        fs: 6,
        dist: 6,
        stab: 2,
        conditions: ['Bleeding', 'Dazed'],
      },
      {
        name: 'Gnoll Cackler',
        subtitle: 'Level 2 · Horde Hexer',
        initials: 'GC',
        stamina: [15, 15],
        marip: [0, 0, 2, 2, 2],
        fs: 2,
        dist: 5,
        stab: 1,
        conditions: ['Restrained'],
      },
      {
        name: 'Goblin Stinker',
        subtitle: 'Level 1 · Horde Controller',
        initials: 'GS',
        stamina: [10, 10],
        marip: [-2, 1, 0, 0, 2],
        fs: 1,
        dist: 5,
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

/** MIME type for HTML5 drag payload: JSON `{ fromGroup, fromMonster }`. */
export const MONSTER_DRAG_MIME = 'application/x-live-steel-monster-ref'

/** MIME type for HTML5 drag payload: JSON `{ fromGroup, fromMonster, fromMinion?, label }`. */
export const CONDITION_DRAG_MIME = 'application/x-live-steel-condition-ref'

/** Identifies a monster row or a specific minion child for condition transfer. */
export type ConditionCreatureRef = {
  groupIndex: number
  monsterIndex: number
  /** `null` = monster / minion parent row; otherwise minion slot index. */
  minionIndex: number | null
}

export function parseConditionDragPayload(raw: string): {
  fromGroup: number
  fromMonster: number
  fromMinion: number | null
  label: string
} | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof o.fromGroup !== 'number' ||
      typeof o.fromMonster !== 'number' ||
      typeof o.label !== 'string' ||
      !Number.isInteger(o.fromGroup) ||
      !Number.isInteger(o.fromMonster)
    ) {
      return null
    }
    let fromMinion: number | null = null
    if (o.fromMinion != null) {
      if (typeof o.fromMinion !== 'number' || !Number.isInteger(o.fromMinion)) return null
      fromMinion = o.fromMinion
    }
    return { fromGroup: o.fromGroup, fromMonster: o.fromMonster, fromMinion, label: o.label }
  } catch {
    return null
  }
}

function creatureRefEquals(a: ConditionCreatureRef, b: ConditionCreatureRef): boolean {
  return (
    a.groupIndex === b.groupIndex &&
    a.monsterIndex === b.monsterIndex &&
    a.minionIndex === b.minionIndex
  )
}

function readConditionEntry(
  groups: readonly EncounterGroup[],
  ref: ConditionCreatureRef,
  label: string,
): ConditionEntry | null {
  const m = groups[ref.groupIndex]?.monsters[ref.monsterIndex]
  if (!m) return null
  if (ref.minionIndex == null) {
    const c = m.conditions.find((x) => x.label === label)
    return c ? { ...c } : null
  }
  const mn = m.minions?.[ref.minionIndex]
  if (!mn) return null
  const c = mn.conditions.find((x) => x.label === label)
  return c ? { ...c } : null
}

function removeConditionFromCreature(
  m: Monster,
  minionIndex: number | null,
  label: string,
): Monster {
  if (minionIndex == null) {
    const idx = m.conditions.findIndex((c) => c.label === label)
    if (idx < 0) return m
    return { ...m, conditions: m.conditions.filter((_, i) => i !== idx) }
  }
  const minions = m.minions
  if (!minions) return m
  const mi = minionIndex
  if (mi < 0 || mi >= minions.length) return m
  return {
    ...m,
    minions: minions.map((mn, i) => {
      if (i !== mi) return mn
      const idx = mn.conditions.findIndex((c) => c.label === label)
      if (idx < 0) return mn
      return { ...mn, conditions: mn.conditions.filter((_, j) => j !== idx) }
    }),
  }
}

function addOrSetConditionOnCreature(
  m: Monster,
  minionIndex: number | null,
  entry: ConditionEntry,
): Monster {
  if (minionIndex == null) {
    const idx = m.conditions.findIndex((c) => c.label === entry.label)
    if (idx >= 0) {
      return {
        ...m,
        conditions: m.conditions.map((c, i) => (i === idx ? { ...c, state: entry.state } : c)),
      }
    }
    return { ...m, conditions: [...m.conditions, { ...entry }] }
  }
  const minions = m.minions
  if (!minions) return m
  const mi = minionIndex
  if (mi < 0 || mi >= minions.length) return m
  return {
    ...m,
    minions: minions.map((mn, i) => {
      if (i !== mi) return mn
      const idx = mn.conditions.findIndex((c) => c.label === entry.label)
      if (idx >= 0) {
        return {
          ...mn,
          conditions: mn.conditions.map((c, j) => (j === idx ? { ...c, state: entry.state } : c)),
        }
      }
      return { ...mn, conditions: [...mn.conditions, { ...entry }] }
    }),
  }
}

/**
 * Remove `label` from `from` and add/set it on `to` with the same {@link ConditionEntry.state}.
 * Returns `null` if source has no such condition or refs are identical.
 */
export function transferConditionBetweenCreatures(
  groups: EncounterGroup[],
  from: ConditionCreatureRef,
  to: ConditionCreatureRef,
  label: string,
): EncounterGroup[] | null {
  if (creatureRefEquals(from, to)) return null
  const entry = readConditionEntry(groups, from, label)
  if (!entry) return null

  if (from.groupIndex === to.groupIndex && from.monsterIndex === to.monsterIndex) {
    const gi = from.groupIndex
    const mi = from.monsterIndex
    const g = groups[gi]
    if (!g) return null
    const m = g.monsters[mi]
    if (!m) return null
    const after = addOrSetConditionOnCreature(
      removeConditionFromCreature(m, from.minionIndex, label),
      to.minionIndex,
      entry,
    )
    return groups.map((grp, idx) =>
      idx === gi
        ? { ...grp, monsters: grp.monsters.map((mm, i) => (i === mi ? after : mm)) }
        : grp,
    )
  }

  return groups.map((g, gi) => ({
    ...g,
    monsters: g.monsters.map((m, mi) => {
      if (gi === from.groupIndex && mi === from.monsterIndex) {
        return removeConditionFromCreature(m, from.minionIndex, label)
      }
      if (gi === to.groupIndex && mi === to.monsterIndex) {
        return addOrSetConditionOnCreature(m, to.minionIndex, entry)
      }
      return m
    }),
  }))
}

/**
 * Insert index in the per-group monsters array after removing the source monster.
 * `toMonster` is "insert before this index" in pre-move coordinates (0..length inclusive for append).
 */
export function computeMonsterInsertIndex(
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
): number | null {
  if (fromGroup === toGroup && fromMonster === toMonster) return null
  if (fromGroup === toGroup) {
    if (fromMonster < toMonster) return toMonster - 1
    return toMonster
  }
  return toMonster
}

function remapCaptainRefAfterMonsterMove(
  ref: CaptainRef,
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  insertIndex: number,
): CaptainRef {
  const g = ref.groupIndex
  let m = ref.monsterIndex
  if (g === fromGroup && m === fromMonster) {
    return { groupIndex: toGroup, monsterIndex: insertIndex }
  }
  if (g === fromGroup && m > fromMonster) {
    m -= 1
  }
  if (g === toGroup && m >= insertIndex) {
    m += 1
  }
  return { groupIndex: g, monsterIndex: m }
}

/**
 * Move one monster to another index (possibly another group). Remaps {@link Monster.captainId} on all monsters.
 */
export function moveMonsterInEncounterWithCaptainRemap(
  groups: EncounterGroup[],
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
): EncounterGroup[] | null {
  if (fromGroup < 0 || toGroup < 0 || fromGroup >= groups.length || toGroup >= groups.length) {
    return null
  }
  const src = groups[fromGroup]?.monsters
  const destLen = groups[toGroup]?.monsters.length
  if (!src || fromMonster < 0 || fromMonster >= src.length || destLen === undefined) return null
  if (toMonster < 0 || toMonster > destLen) return null

  const insertIndex = computeMonsterInsertIndex(fromGroup, fromMonster, toGroup, toMonster)
  if (insertIndex === null) return null

  const monster = src[fromMonster]!
  const next = groups.map((g) => ({
    ...g,
    monsters: [...g.monsters],
  }))

  next[fromGroup]!.monsters.splice(fromMonster, 1)
  next[toGroup]!.monsters.splice(insertIndex, 0, monster)

  return next.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      if (!m.captainId) return m
      const ref = remapCaptainRefAfterMonsterMove(
        m.captainId,
        fromGroup,
        fromMonster,
        toGroup,
        insertIndex,
      )
      if (ref.groupIndex === m.captainId.groupIndex && ref.monsterIndex === m.captainId.monsterIndex) {
        return m
      }
      return { ...m, captainId: ref }
    }),
  }))
}

/** Remap EoT confirmation keys after a monster move (indices are per-group). */
export function remapEotConfirmedAfterMonsterMove(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
): Map<number, Set<string>> {
  const ins = computeMonsterInsertIndex(fromGroup, fromMonster, toGroup, toMonster)
  if (ins === null) {
    return new Map(Array.from({ length: groupCount }, (_, i) => [i, new Set(prev.get(i) ?? [])]))
  }

  const out = new Map<number, Set<string>>()
  for (let gi = 0; gi < groupCount; gi++) {
    const src = prev.get(gi) ?? new Set<string>()
    const dst = new Set<string>()

    if (gi === fromGroup && gi !== toGroup) {
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        if (mi === fromMonster) continue
        const tail = parts.slice(1).join(':')
        if (mi > fromMonster) dst.add(`${mi - 1}:${tail}`)
        else dst.add(key)
      }
    } else if (gi === toGroup && gi !== fromGroup) {
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        const tail = parts.slice(1).join(':')
        const newMi = mi >= ins ? mi + 1 : mi
        dst.add(`${newMi}:${tail}`)
      }
      const fromKeys = prev.get(fromGroup) ?? new Set<string>()
      for (const key of fromKeys) {
        const parts = key.split(':')
        if (parts.length < 2) continue
        const mi = Number(parts[0])
        if (!Number.isFinite(mi) || mi !== fromMonster) continue
        const tail = parts.slice(1).join(':')
        dst.add(`${ins}:${tail}`)
      }
    } else if (gi === fromGroup && gi === toGroup) {
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        const tail = parts.slice(1).join(':')
        if (mi === fromMonster) {
          dst.add(`${ins}:${tail}`)
        } else {
          const mi2 = mi > fromMonster ? mi - 1 : mi
          const mi3 = mi2 >= ins ? mi2 + 1 : mi2
          dst.add(`${mi3}:${tail}`)
        }
      }
    } else {
      for (const key of src) dst.add(key)
    }

    out.set(gi, dst)
  }
  return out
}

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
