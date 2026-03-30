export type Marip = readonly [number, number, number, number, number]

export type ConditionState = 'neutral' | 'eot' | 'se'

export type PowerRollEffect = {
  roll?: string
  tier1?: string
  tier2?: string
  tier3?: string
  name?: string
  effect?: string
}

export type MonsterFeature = {
  type: 'feature'
  feature_type: 'ability' | 'trait'
  name: string
  icon?: string
  ability_type?: string
  keywords?: string[]
  usage?: string
  distance?: string
  target?: string
  cost?: string
  effects?: PowerRollEffect[]
}

export type ConditionEntry = {
  label: string
  state: ConditionState
}

export type CaptainRef = {
  groupIndex: number
  monsterIndex: number
}

export type Monster = {
  name: string
  subtitle: string
  initials: string
  stamina: [number, number]
  marip: Marip | null
  fs: number
  dist: number
  stab: number
  conditions: readonly ConditionEntry[]
  minions?: MinionEntry[]
  features?: MonsterFeature[]
  captainId?: CaptainRef | null
}

export type MinionEntry = {
  name: string
  initials: string
  conditions: readonly ConditionEntry[]
  dead: boolean
}

export type GroupColorId =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'white'
  | 'grey'
  | 'black'

export type EncounterGroup = {
  /** Stable key for React lists and future cross-index state (timers, etc.). */
  id: string
  monsters: Monster[]
  color: GroupColorId
}

/** Which row opened the monster stat card drawer (ordinal circle differs per case). */
export type MonsterCardDrawerView =
  | { kind: 'standard' }
  | { kind: 'minionParent' }
  | { kind: 'minion'; slot: number }

export type MonsterCardDrawerState = {
  groupIndex: number
  monsterIndex: number
  view: MonsterCardDrawerView
}

export function monsterCardDrawerViewEquals(a: MonsterCardDrawerView, b: MonsterCardDrawerView): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'minion' && b.kind === 'minion') return a.slot === b.slot
  return true
}

export type MinionEntrySeed = {
  name: string
  initials: string
  conditions: readonly string[]
  dead?: boolean
}

/** Static encounter data uses plain condition names; clone maps them to {@link ConditionEntry}. */
export type MonsterSeed = Omit<Monster, 'conditions' | 'minions'> & {
  conditions: readonly string[]
  minions?: readonly MinionEntrySeed[]
  features?: readonly MonsterFeature[]
}

export type EncounterGroupSeed = {
  monsters: readonly MonsterSeed[]
}

export type TerrainRowState = {
  object: string
  stamina: [number, number]
  note: string
  /** Bestiary terrain name for stat-block lookup; absent on legacy/custom rows. */
  terrainName?: string
}

export type TerrainRowSeed = TerrainRowState

export type GroupColorMenuState = {
  open: boolean
  anchor: HTMLElement | null
  monsterIndex: number | null
}
