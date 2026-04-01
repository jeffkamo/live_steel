import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type {
  CaptainRef,
  ConditionState,
  EncounterGroup,
  GroupColorId,
  Monster,
  MonsterCardDrawerState,
  MonsterCardDrawerView,
  TerrainRowState,
} from './types'
import { monsterCardDrawerViewEquals } from './types'
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  loadEncounterIndex,
  saveEncounterIndex,
  migrateFromLegacyStorage,
  newEncounterId,
  deleteEncounterFromStorage,
  type PersistedEncounterIndex,
  type EncounterIndexEntry,
} from './persistence'
import {
  cloneEncounterGroups,
  cloneMonster,
  cloneTerrainRows,
  CONDITION_DRAG_MIME,
  ENCOUNTER_GROUP_DRAG_MIME,
  MONSTER_DRAG_MIME,
  TERRAIN_DRAG_MIME,
  mapMinionIndexAfterReorder,
  mapMinionDrawerSlotAfterMinionInserted,
  mapMinionDrawerSlotAfterMinionRemoved,
  mergeTopLevelMonsterIntoHorde,
  monsterDragDropIsValid,
  moveIndexInArray,
  moveMonsterInEncounterWithCaptainRemap,
  parseMonsterDragPayload,
  type MonsterDragPayload,
  nextHordePoolStamina,
  hordePoolStaminaAfterMinionDeadToggle,
  staminaAfterConvertSoloToHorde,
  staminaAfterHordeDemotedToSolo,
  transferMinionBetweenHordes,
  remapEotConfirmedAfterMinionRemoved,
  remapEotConfirmedAfterMinionTransferBetweenHordes,
  remapEotConfirmedAfterSoloMergedIntoHorde,
  remapEotConfirmedAfterConvertToSquad,
  newEncounterGroupId,
  nextUnusedColor,
  randomUnusedColor,
  parseConditionDragPayload,
  remapEncounterGroupIndex,
  remapEotConfirmedAfterMonsterMove,
  reorderEncounterGroupsWithCaptainRemap,
  GROUP_COLOR_BADGE,
  ROSTER_GRID_TEMPLATE,
  transferConditionBetweenCreatures,
  type ConditionCreatureRef,
} from './data'
import { TitleRule } from './components/TitleRule'
import { GroupSection } from './components/GroupSection'
import { StatBlock } from './components/StatBlock'
import { TerrainRow } from './components/TerrainRow'
import { AddTerrainButton } from './components/AddTerrainButton'
import { TerrainStatBlock } from './components/TerrainStatBlock'

const DRAWER_PANEL_W_CLASS = 'w-[min(20rem,calc(100vw-2rem))]'
const MONSTER_DRAWER_CLOSE_MS = 300

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  return mq?.matches === true
}

function initStateFromStorage(): {
  encounterGroups: EncounterGroup[]
  terrainRows: TerrainRowState[]
  groupTurnActed: boolean[]
  encounterIndex: PersistedEncounterIndex
  activeEncounterId: string
  encounterName: string
} {
  let index = loadEncounterIndex()
  if (!index) {
    const migrated = migrateFromLegacyStorage()
    if (migrated) {
      index = migrated.index
      if (migrated.state.ok) {
        return {
          encounterGroups: migrated.state.state.encounterGroups,
          terrainRows: migrated.state.state.terrainRows,
          groupTurnActed: migrated.state.state.groupTurnActed,
          encounterIndex: index,
          activeEncounterId: index.activeId,
          encounterName: index.encounters[0]?.name ?? 'Encounter 1',
        }
      }
    }
  }

  if (index && index.encounters.length > 0) {
    const activeEntry = index.encounters.find((e) => e.id === index!.activeId) ?? index.encounters[0]!
    const loaded = loadFromLocalStorage(activeEntry.id)
    if (loaded.ok) {
      return {
        encounterGroups: loaded.state.encounterGroups,
        terrainRows: loaded.state.terrainRows,
        groupTurnActed: loaded.state.groupTurnActed,
        encounterIndex: { ...index, activeId: activeEntry.id },
        activeEncounterId: activeEntry.id,
        encounterName: activeEntry.name,
      }
    }
  }

  const id = newEncounterId()
  const name = 'Encounter 1'
  const newIndex: PersistedEncounterIndex = {
    version: 1,
    encounters: [{ id, name }],
    activeId: id,
  }
  return {
    encounterGroups: cloneEncounterGroups(),
    terrainRows: cloneTerrainRows(),
    groupTurnActed: [],
    encounterIndex: newIndex,
    activeEncounterId: id,
    encounterName: name,
  }
}

function App() {
  const [{
    encounterGroups: initGroups,
    terrainRows: initTerrain,
    groupTurnActed: initTurns,
    encounterIndex: initIndex,
    activeEncounterId: initEncId,
    encounterName: initEncName,
  }] = useState(initStateFromStorage)
  const [encounterGroups, setEncounterGroups] = useState(() => initGroups)
  const [terrainRows, setTerrainRows] = useState(() => initTerrain)
  const [groupTurnActed, setGroupTurnActed] = useState(() => initTurns)
  const [uiLocked, setUiLocked] = useState(false)
  const canAddGroup = nextUnusedColor(encounterGroups.map((g) => g.color)) != null
  const [monsterCardDrawer, setMonsterCardDrawer] = useState<MonsterCardDrawerState | null>(null)
  const [terrainDrawerIndex, setTerrainDrawerIndex] = useState<number | null>(null)
  const [drawerAnimatingOut, setDrawerAnimatingOut] = useState(false)
  const [drawerEntered, setDrawerEntered] = useState(false)
  const [dropTargetTerrainIndex, setDropTargetTerrainIndex] = useState<number | null>(null)

  const [encounterIndex, setEncounterIndex] = useState<PersistedEncounterIndex>(() => initIndex)
  const [activeEncounterId, setActiveEncounterId] = useState(() => initEncId)
  const [encounterName, setEncounterName] = useState(() => initEncName)
  const [showNewEncounterPrompt, setShowNewEncounterPrompt] = useState(false)
  const [newEncounterNameInput, setNewEncounterNameInput] = useState('')
  const newEncounterInputRef = useRef<HTMLInputElement>(null)
  const [showEncounterSwitcher, setShowEncounterSwitcher] = useState(false)
  const encounterSwitcherRef = useRef<HTMLDivElement>(null)

  const monsterCardDrawerRef = useRef(monsterCardDrawer)
  monsterCardDrawerRef.current = monsterCardDrawer
  const prevDrawerForEnterRef = useRef<MonsterCardDrawerState | null>(null)

  useEffect(() => {
    saveToLocalStorage(encounterGroups, terrainRows, groupTurnActed, activeEncounterId)
  }, [encounterGroups, terrainRows, groupTurnActed, activeEncounterId])

  useEffect(() => {
    saveEncounterIndex(encounterIndex)
  }, [encounterIndex])

  const eotTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const [seActWindowElapsedGroup, setSeActWindowElapsedGroup] = useState<Set<number>>(() => new Set())
  const [eotConfirmed, setEotConfirmed] = useState<Map<number, Set<string>>>(() => new Map())
  const eotConfirmedLatest = useRef(eotConfirmed)
  eotConfirmedLatest.current = eotConfirmed
  const prevTurnActedRef = useRef<boolean[]>([...initTurns])

  const scheduleEotTimerForGroup = useCallback((gi: number) => {
    const existing = eotTimersRef.current.get(gi)
    if (existing != null) {
      clearTimeout(existing)
      eotTimersRef.current.delete(gi)
    }
    const timer = setTimeout(() => {
      eotTimersRef.current.delete(gi)
      const confirmed = eotConfirmedLatest.current.get(gi) ?? new Set<string>()
      setEncounterGroups((groups) =>
        groups.map((g, gIdx) => {
          if (gIdx !== gi) return g
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              const updated = {
                ...m,
                conditions: m.conditions.filter((c) => {
                  if (c.state !== 'eot') return true
                  return confirmed.has(`${mi}:${c.label}`)
                }),
              }
              if (!m.minions) return updated
              return {
                ...updated,
                minions: m.minions.map((minion, mni) => ({
                  ...minion,
                  conditions: minion.conditions.filter((c) => {
                    if (c.state !== 'eot') return true
                    return confirmed.has(`${mi}:${mni}:${c.label}`)
                  }),
                })),
              }
            }),
          }
        }),
      )
      setEotConfirmed((prev) => {
        const next = new Map(prev)
        next.delete(gi)
        return next
      })
      setSeActWindowElapsedGroup((prev) => new Set(prev).add(gi))
    }, 30_000)
    eotTimersRef.current.set(gi, timer)
  }, [])

  const confirmEotCondition = useCallback(
    (groupIndex: number, monsterIndex: number, label: string, minionIndex?: number) => {
      const key = minionIndex != null
        ? `${monsterIndex}:${minionIndex}:${label}`
        : `${monsterIndex}:${label}`
      setEotConfirmed((prev) => {
        const next = new Map(prev)
        const set = new Set(prev.get(groupIndex))
        set.add(key)
        next.set(groupIndex, set)
        return next
      })
    },
    [],
  )

  const isEotConfirmed = useCallback(
    (groupIndex: number, monsterIndex: number, label: string, minionIndex?: number): boolean => {
      const key = minionIndex != null
        ? `${monsterIndex}:${minionIndex}:${label}`
        : `${monsterIndex}:${label}`
      return eotConfirmed.get(groupIndex)?.has(key) ?? false
    },
    [eotConfirmed],
  )

  useEffect(() => {
    const prev = prevTurnActedRef.current
    for (let gi = 0; gi < groupTurnActed.length; gi++) {
      const wasActed = prev[gi] ?? false
      const isActed = groupTurnActed[gi]!

      if (!wasActed && isActed) {
        scheduleEotTimerForGroup(gi)
      }

      if (wasActed && !isActed) {
        const timer = eotTimersRef.current.get(gi)
        if (timer != null) {
          clearTimeout(timer)
          eotTimersRef.current.delete(gi)
        }
        setEotConfirmed((prev) => {
          const next = new Map(prev)
          next.delete(gi)
          return next
        })
        setSeActWindowElapsedGroup((prev) => {
          const next = new Set(prev)
          next.delete(gi)
          return next
        })
      }
    }
    prevTurnActedRef.current = [...groupTurnActed]
  }, [groupTurnActed, scheduleEotTimerForGroup])

  useEffect(() => {
    const timers = eotTimersRef.current
    return () => {
      for (const timer of timers.values()) clearTimeout(timer)
    }
  }, [])

  const patchMonsterStamina = useCallback(
    (groupIndex: number, monsterIndex: number, stamina: [number, number]) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex) return m
              if (m.minions?.length) {
                return {
                  ...m,
                  stamina: nextHordePoolStamina({ ...m, stamina: [stamina[0], stamina[1]] }, m.minions),
                }
              }
              return { ...m, stamina: [stamina[0], stamina[1]] }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMonsterConditionRemove = useCallback(
    (groupIndex: number, monsterIndex: number, conditionIndex: number) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex) {
                return m
              }
              return {
                ...m,
                conditions: m.conditions.filter((_, ci) => ci !== conditionIndex),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMonsterConditionAddOrSet = useCallback(
    (groupIndex: number, monsterIndex: number, label: string, state: ConditionState) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex) {
                return m
              }
              const idx = m.conditions.findIndex((c) => c.label === label)
              if (idx >= 0) {
                return {
                  ...m,
                  conditions: m.conditions.map((c, ci) =>
                    ci === idx ? { ...c, state } : c,
                  ),
                }
              }
              return {
                ...m,
                conditions: [...m.conditions, { label, state }],
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMinionConditionRemove = useCallback(
    (groupIndex: number, monsterIndex: number, minionIndex: number, conditionIndex: number) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex || !m.minions) return m
              return {
                ...m,
                minions: m.minions.map((minion, mni) => {
                  if (mni !== minionIndex) return minion
                  return {
                    ...minion,
                    conditions: minion.conditions.filter((_, ci) => ci !== conditionIndex),
                  }
                }),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMinionDead = useCallback(
    (groupIndex: number, monsterIndex: number, minionIndex: number, dead: boolean) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex || !m.minions) return m
              const nextMinions = m.minions.map((minion, mni) =>
                mni === minionIndex ? { ...minion, dead } : minion,
              )
              return {
                ...m,
                minions: nextMinions,
                stamina: hordePoolStaminaAfterMinionDeadToggle(m, nextMinions),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMinionCaptain = useCallback(
    (groupIndex: number, monsterIndex: number, captainId: CaptainRef | null) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex || !m.minions) return m
              return { ...m, captainId }
            }),
          }
        }),
      )
    },
    [],
  )

  const addMonsterToGroup = useCallback(
    (groupIndex: number, monster: Monster) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          return { ...g, monsters: [...g.monsters, monster] }
        }),
      )
    },
    [],
  )

  const duplicateMonster = useCallback(
    (groupIndex: number, monsterIndex: number) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          const src = g.monsters[monsterIndex]
          if (!src) return g
          const copy = cloneMonster(src)
          copy.captainId = undefined
          const monsters = [...g.monsters]
          monsters.splice(monsterIndex + 1, 0, copy)
          return { ...g, monsters }
        }),
      )
    },
    [],
  )

  const duplicateMinionFromHorde = useCallback(
    (groupIndex: number, monsterIndex: number, minionIndex: number) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          const m = g.monsters[monsterIndex]
          const minions = m?.minions
          if (!m || !minions || minionIndex < 0 || minionIndex >= minions.length) return g
          const src = minions[minionIndex]!
          const copy = { ...src, conditions: src.conditions.map((c) => ({ ...c })) }
          const nextMinions = [...minions]
          nextMinions.splice(minionIndex + 1, 0, copy)
          const monsters = [...g.monsters]
          monsters[monsterIndex] = { ...m, minions: nextMinions }
          return { ...g, monsters }
        }),
      )
    },
    [],
  )

  const deleteMinionFromHorde = useCallback(
    (groupIndex: number, monsterIndex: number, minionIndex: number) => {
      let applied = false
      let demotedToSolo = false
      let groupCount = 0
      setEncounterGroups((prev) => {
        groupCount = prev.length
        const g = prev[groupIndex]
        const m = g?.monsters[monsterIndex]
        const minions = m?.minions
        if (!g || !m || !minions || minionIndex < 0 || minionIndex >= minions.length) {
          return prev
        }
        applied = true
        const nextMinions = minions.filter((_, i) => i !== minionIndex)
        demotedToSolo = nextMinions.length === 0
        if (demotedToSolo) {
          return prev.map((gr, gi) => {
            if (gi !== groupIndex) return gr
            return {
              ...gr,
              monsters: gr.monsters.map((mon, mi) => {
                if (mi !== monsterIndex) return mon
                const { minions: _removed, ...solo } = mon
                return { ...solo, stamina: staminaAfterHordeDemotedToSolo(mon) }
              }),
            }
          })
        }
        return prev.map((gr, gi) => {
          if (gi !== groupIndex) return gr
          return {
            ...gr,
            monsters: gr.monsters.map((mon, mi) =>
              mi === monsterIndex
                ? {
                    ...mon,
                    minions: nextMinions,
                    stamina: nextHordePoolStamina(mon, nextMinions),
                  }
                : mon,
            ),
          }
        })
      })
      if (applied) {
        setEotConfirmed((eotPrev) =>
          remapEotConfirmedAfterMinionRemoved(
            eotPrev,
            groupCount,
            groupIndex,
            monsterIndex,
            minionIndex,
            demotedToSolo,
          ),
        )
      }
    },
    [],
  )

  const convertMonsterToSquad = useCallback((groupIndex: number, monsterIndex: number) => {
    let applied = false
    let groupCount = 0
    setEncounterGroups((prev) => {
      groupCount = prev.length
      const g = prev[groupIndex]
      const m = g?.monsters[monsterIndex]
      if (!g || !m || (m.minions && m.minions.length > 0)) return prev
      applied = true
      return prev.map((gr, gi) => {
        if (gi !== groupIndex) return gr
        return {
          ...gr,
          monsters: gr.monsters.map((mon, mi) => {
            if (mi !== monsterIndex) return mon
            const minions = [
              {
                name: `${mon.name} 1`,
                initials: mon.initials,
                conditions: [...mon.conditions],
                dead: false,
              },
            ]
            return {
              ...mon,
              conditions: [],
              minions,
              stamina: staminaAfterConvertSoloToHorde(mon, minions),
            }
          }),
        }
      })
    })
    if (applied) {
      setEotConfirmed((eotPrev) =>
        remapEotConfirmedAfterConvertToSquad(eotPrev, groupCount, groupIndex, monsterIndex),
      )
    }
  }, [])

  const deleteEncounterGroup = useCallback((groupIndex: number) => {
    const timer = eotTimersRef.current.get(groupIndex)
    if (timer != null) {
      clearTimeout(timer)
      eotTimersRef.current.delete(groupIndex)
    }
    setEncounterGroups((prev) =>
      prev
        .filter((_, i) => i !== groupIndex)
        .map((g) => ({
          ...g,
          monsters: g.monsters.map((m) => {
            if (!m.captainId) return m
            const ref = m.captainId
            if (ref.groupIndex === groupIndex) return { ...m, captainId: null }
            if (ref.groupIndex > groupIndex) {
              return {
                ...m,
                captainId: { groupIndex: ref.groupIndex - 1, monsterIndex: ref.monsterIndex },
              }
            }
            return m
          }),
        })),
    )
    setGroupTurnActed((prev) => {
      const next = prev.filter((_, i) => i !== groupIndex)
      prevTurnActedRef.current = next
      return next
    })
    setEotConfirmed((prev) => {
      const next = new Map<number, Set<string>>()
      for (const [gi, set] of prev) {
        if (gi === groupIndex) continue
        const newGi = gi > groupIndex ? gi - 1 : gi
        next.set(newGi, new Set(set))
      }
      return next
    })
    setSeActWindowElapsedGroup((prev) => {
      const next = new Set<number>()
      for (const gi of prev) {
        if (gi === groupIndex) continue
        next.add(gi > groupIndex ? gi - 1 : gi)
      }
      return next
    })
    setMonsterCardDrawer((prev) => {
      if (prev == null) return null
      if (prev.groupIndex === groupIndex) return null
      if (prev.groupIndex > groupIndex) {
        return { ...prev, groupIndex: prev.groupIndex - 1 }
      }
      return prev
    })
  }, [])

  const deleteMonster = useCallback(
    (groupIndex: number, monsterIndex: number) => {
      let groupRemoved = false

      setEncounterGroups((prev) => {
        groupRemoved = prev[groupIndex]?.monsters.length === 1

        const afterRemove = prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          return {
            ...g,
            monsters: g.monsters.filter((_, mi) => mi !== monsterIndex),
          }
        }).filter((g) => g.monsters.length > 0)

        return afterRemove.map((g) => ({
          ...g,
          monsters: g.monsters.map((m) => {
            if (!m.captainId) return m
            const ref = m.captainId
            if (ref.groupIndex === groupIndex && ref.monsterIndex === monsterIndex) {
              return { ...m, captainId: null }
            }
            let newGi = ref.groupIndex
            let newMi = ref.monsterIndex
            if (groupRemoved && ref.groupIndex > groupIndex) {
              newGi -= 1
            }
            if (!groupRemoved && ref.groupIndex === groupIndex && ref.monsterIndex > monsterIndex) {
              newMi -= 1
            }
            if (newGi !== ref.groupIndex || newMi !== ref.monsterIndex) {
              return { ...m, captainId: { groupIndex: newGi, monsterIndex: newMi } }
            }
            return m
          }),
        }))
      })

      setGroupTurnActed((prev) =>
        groupRemoved ? prev.filter((_, i) => i !== groupIndex) : prev,
      )
    },
    [],
  )

  const [dropTargetGroupIndex, setDropTargetGroupIndex] = useState<number | null>(null)
  const monsterDragSourceRef = useRef<MonsterDragPayload | null>(null)

  const [monsterDropTarget, setMonsterDropTarget] = useState<{
    groupIndex: number
    monsterIndex: number
    minionIndex: number | null
    invalid: boolean
  } | null>(null)

  const [monsterDropRejectFlash, setMonsterDropRejectFlash] = useState<{
    groupIndex: number
    monsterIndex: number
    minionIndex: number | null
    id: number
  } | null>(null)
  const rejectFlashIdRef = useRef(0)

  useEffect(() => {
    if (monsterDropRejectFlash == null) return
    const t = window.setTimeout(() => setMonsterDropRejectFlash(null), 520)
    return () => window.clearTimeout(t)
  }, [monsterDropRejectFlash])

  const [conditionDropTarget, setConditionDropTarget] = useState<{
    groupIndex: number
    monsterIndex: number
    minionIndex: number | null
  } | null>(null)

  const clearEotOnConditionTransfer = useCallback(
    (fromGroup: number, fromMonster: number, fromMinion: number | null, label: string) => {
      const key =
        fromMinion == null ? `${fromMonster}:${label}` : `${fromMonster}:${fromMinion}:${label}`
      setEotConfirmed((prev) => {
        const set = prev.get(fromGroup)
        if (!set?.has(key)) return prev
        const next = new Map(prev)
        const copy = new Set(set)
        copy.delete(key)
        next.set(fromGroup, copy)
        return next
      })
    },
    [],
  )

  const onConditionDragStart = useCallback(
    (gi: number, mi: number, mni: number | null, label: string, e: DragEvent) => {
      e.dataTransfer.setData(
        CONDITION_DRAG_MIME,
        JSON.stringify({
          fromGroup: gi,
          fromMonster: mi,
          ...(mni != null ? { fromMinion: mni } : {}),
          label,
        }),
      )
      e.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  const onConditionDragEnd = useCallback(() => {
    setConditionDropTarget(null)
  }, [])

  const onConditionDragOver = useCallback((gi: number, mi: number, mni: number | null, e: DragEvent) => {
    if (![...e.dataTransfer.types].includes(CONDITION_DRAG_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setConditionDropTarget({ groupIndex: gi, monsterIndex: mi, minionIndex: mni })
  }, [])

  const onConditionDragLeave = useCallback((gi: number, mi: number, mni: number | null, e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setConditionDropTarget((v) =>
        v?.groupIndex === gi && v?.monsterIndex === mi && v?.minionIndex === mni ? null : v,
      )
    }
  }, [])

  const onConditionDrop = useCallback(
    (toG: number, toM: number, toMni: number | null, e: DragEvent) => {
      e.preventDefault()
      setConditionDropTarget(null)
      const raw = e.dataTransfer.getData(CONDITION_DRAG_MIME)
      const payload = parseConditionDragPayload(raw)
      if (!payload) return
      const from: ConditionCreatureRef = {
        groupIndex: payload.fromGroup,
        monsterIndex: payload.fromMonster,
        minionIndex: payload.fromMinion,
      }
      const to: ConditionCreatureRef = {
        groupIndex: toG,
        monsterIndex: toM,
        minionIndex: toMni,
      }
      setEncounterGroups((prev) => {
        const next = transferConditionBetweenCreatures(prev, from, to, payload.label)
        if (!next) return prev
        queueMicrotask(() => {
          clearEotOnConditionTransfer(
            payload.fromGroup,
            payload.fromMonster,
            payload.fromMinion,
            payload.label,
          )
        })
        return next
      })
    },
    [clearEotOnConditionTransfer],
  )

  const moveMonsterInEncounter = useCallback(
    (fromG: number, fromM: number, toG: number, toM: number) => {
      setEncounterGroups((prev) => {
        const next = moveMonsterInEncounterWithCaptainRemap(prev, fromG, fromM, toG, toM)
        if (!next) return prev
        queueMicrotask(() => {
          setEotConfirmed((e) =>
            remapEotConfirmedAfterMonsterMove(e, next.length, fromG, fromM, toG, toM),
          )
        })
        return next
      })
    },
    [],
  )

  const onMonsterDragStart = useCallback((fromG: number, fromM: number, e: DragEvent, fromMinion?: number) => {
    const payload: MonsterDragPayload =
      fromMinion != null
        ? { fromGroup: fromG, fromMonster: fromM, fromMinion }
        : { fromGroup: fromG, fromMonster: fromM }
    monsterDragSourceRef.current = payload
    e.dataTransfer.setData(MONSTER_DRAG_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onMonsterDragEnd = useCallback(() => {
    monsterDragSourceRef.current = null
    setMonsterDropTarget(null)
  }, [])

  const onMonsterDragOver = useCallback(
    (toG: number, toM: number, toMinion: number | null, e: DragEvent) => {
      if (![...e.dataTransfer.types].includes(MONSTER_DRAG_MIME)) return
      const source = monsterDragSourceRef.current
      if (!source) return
      e.preventDefault()
      const valid = monsterDragDropIsValid(source, toG, toM, toMinion, encounterGroups)
      e.dataTransfer.dropEffect = valid ? 'move' : 'none'
      setMonsterDropTarget({
        groupIndex: toG,
        monsterIndex: toM,
        minionIndex: toMinion,
        invalid: !valid,
      })
    },
    [encounterGroups],
  )

  const onMonsterDragLeave = useCallback(
    (toG: number, toM: number, toMinion: number | null, e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setMonsterDropTarget((v) =>
          v != null &&
          v.groupIndex === toG &&
          v.monsterIndex === toM &&
          v.minionIndex === toMinion
            ? null
            : v,
        )
      }
    },
    [],
  )

  const triggerMonsterDropRejectFlash = useCallback(
    (toG: number, toM: number, toMinion: number | null) => {
      rejectFlashIdRef.current += 1
      setMonsterDropRejectFlash({
        groupIndex: toG,
        monsterIndex: toM,
        minionIndex: toMinion,
        id: rejectFlashIdRef.current,
      })
    },
    [],
  )

  const onMonsterDrop = useCallback(
    (toG: number, toM: number, toMinion: number | null, e: DragEvent) => {
      e.preventDefault()
      setMonsterDropTarget(null)
      const raw = e.dataTransfer.getData(MONSTER_DRAG_MIME)
      const payload = parseMonsterDragPayload(raw)
      if (!payload) return
      if (!monsterDragDropIsValid(payload, toG, toM, toMinion, encounterGroups)) {
        triggerMonsterDropRejectFlash(toG, toM, toMinion)
        return
      }
      if (payload.fromMinion != null) {
        if (toMinion == null) return
        const fromMinion = payload.fromMinion
        const sameParentReorder =
          payload.fromGroup === toG && payload.fromMonster === toM
        let reorderFailed = false
        setEncounterGroups((prev) => {
          const next = transferMinionBetweenHordes(
            prev,
            payload.fromGroup,
            payload.fromMonster,
            fromMinion,
            toG,
            toM,
            toMinion,
          )
          if (!next) {
            reorderFailed = true
            return prev
          }
          const groupCount = next.length
          queueMicrotask(() => {
            setEotConfirmed((eMap) =>
              remapEotConfirmedAfterMinionTransferBetweenHordes(
                eMap,
                groupCount,
                payload.fromGroup,
                payload.fromMonster,
                fromMinion,
                toG,
                toM,
                toMinion,
              ),
            )
            setMonsterCardDrawer((drawer) => {
              if (drawer == null || drawer.view.kind !== 'minion') return drawer
              const { groupIndex: dg, monsterIndex: dm, view } = drawer
              const slot = view.slot
              if (dg === payload.fromGroup && dm === payload.fromMonster && slot === fromMinion) {
                return {
                  ...drawer,
                  groupIndex: toG,
                  monsterIndex: toM,
                  view: { kind: 'minion', slot: toMinion },
                }
              }
              if (sameParentReorder) {
                const newSlot = mapMinionIndexAfterReorder(fromMinion, toMinion, slot)
                if (newSlot === slot) return drawer
                return { ...drawer, view: { kind: 'minion', slot: newSlot } }
              }
              let nextDrawer = drawer
              if (dg === payload.fromGroup && dm === payload.fromMonster) {
                const ns = mapMinionDrawerSlotAfterMinionRemoved(fromMinion, slot)
                if (ns === null) return drawer
                if (ns !== slot) {
                  nextDrawer = { ...nextDrawer, view: { kind: 'minion', slot: ns } }
                }
              }
              if (dg === toG && dm === toM) {
                const slotNow = nextDrawer.view.kind === 'minion' ? nextDrawer.view.slot : slot
                const ns = mapMinionDrawerSlotAfterMinionInserted(toMinion, slotNow)
                if (ns !== slotNow) {
                  nextDrawer = { ...nextDrawer, view: { kind: 'minion', slot: ns } }
                }
              }
              return nextDrawer
            })
          })
          return next
        })
        if (reorderFailed) triggerMonsterDropRejectFlash(toG, toM, toMinion)
        return
      }
      if (toMinion != null) {
        let mergeFailed = false
        setEncounterGroups((prev) => {
          const merged = mergeTopLevelMonsterIntoHorde(
            prev,
            payload.fromGroup,
            payload.fromMonster,
            toG,
            toM,
            toMinion,
          )
          if (merged == null) {
            mergeFailed = true
            return prev
          }
          const gc = merged.length
          queueMicrotask(() => {
            setEotConfirmed((e) =>
              remapEotConfirmedAfterSoloMergedIntoHorde(
                e,
                gc,
                payload.fromGroup,
                payload.fromMonster,
                toG,
                toM,
                toMinion,
              ),
            )
            setMonsterCardDrawer((drawer) => {
              if (
                drawer != null &&
                drawer.groupIndex === payload.fromGroup &&
                drawer.monsterIndex === payload.fromMonster &&
                drawer.view.kind === 'standard'
              ) {
                const toMi =
                  payload.fromGroup === toG && payload.fromMonster < toM ? toM - 1 : toM
                return {
                  groupIndex: toG,
                  monsterIndex: toMi,
                  view: { kind: 'minion', slot: toMinion },
                }
              }
              if (drawer == null) return drawer
              let d = drawer
              if (d.groupIndex === payload.fromGroup && d.monsterIndex > payload.fromMonster) {
                d = { ...d, monsterIndex: d.monsterIndex - 1 }
              }
              const targetMi =
                payload.fromGroup === toG && payload.fromMonster < toM ? toM - 1 : toM
              if (d.groupIndex === toG && d.monsterIndex === targetMi && d.view.kind === 'minion') {
                const ns = mapMinionDrawerSlotAfterMinionInserted(toMinion, d.view.slot)
                if (ns !== d.view.slot) {
                  d = { ...d, view: { kind: 'minion', slot: ns } }
                }
              }
              return d
            })
          })
          return merged
        })
        if (mergeFailed) triggerMonsterDropRejectFlash(toG, toM, toMinion)
        return
      }
      moveMonsterInEncounter(payload.fromGroup, payload.fromMonster, toG, toM)
    },
    [encounterGroups, moveMonsterInEncounter, triggerMonsterDropRejectFlash],
  )

  const reorderEncounterGroups = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      const scheduledOld = [...eotTimersRef.current.keys()]
      for (const t of eotTimersRef.current.values()) clearTimeout(t)
      eotTimersRef.current.clear()

      const remap = (oldGi: number) => remapEncounterGroupIndex(from, to, oldGi)

      prevTurnActedRef.current = moveIndexInArray(prevTurnActedRef.current, from, to)

      setEncounterGroups((prev) => reorderEncounterGroupsWithCaptainRemap(prev, from, to))
      setGroupTurnActed((prev) => moveIndexInArray(prev, from, to))
      setEotConfirmed((prev) => {
        const next = new Map<number, Set<string>>()
        for (const [gi, set] of prev) {
          next.set(remap(gi), new Set(set))
        }
        return next
      })
      setSeActWindowElapsedGroup((prev) => {
        const next = new Set<number>()
        for (const gi of prev) next.add(remap(gi))
        return next
      })

      queueMicrotask(() => {
        for (const oldGi of scheduledOld) {
          scheduleEotTimerForGroup(remap(oldGi))
        }
      })
    },
    [scheduleEotTimerForGroup],
  )

  const addNewGroup = useCallback(() => {
    let added = false
    setEncounterGroups((prev) => {
      const color = randomUnusedColor(prev.map((g) => g.color))
      if (color == null) return prev
      added = true
      return [...prev, { id: newEncounterGroupId(), monsters: [], color }]
    })
    setGroupTurnActed((prev) => (added ? [...prev, false] : prev))
  }, [])

  const duplicateEncounterGroup = useCallback(
    (groupIndex: number) => {
      let duplicated = false
      setEncounterGroups((prev) => {
        const src = prev[groupIndex]
        if (!src) return prev
        const newColor = randomUnusedColor(prev.map((g) => g.color))
        if (newColor == null) return prev
        duplicated = true
        const copy: EncounterGroup = {
          id: newEncounterGroupId(),
          color: newColor,
          monsters: src.monsters.map((m) => {
            const c = cloneMonster(m)
            c.captainId = undefined
            return c
          }),
        }
        const next = [...prev]
        next.splice(groupIndex + 1, 0, copy)
        return next
      })
      setGroupTurnActed((prev) => {
        if (!duplicated) return prev
        const next = [...prev]
        next.splice(groupIndex + 1, 0, false)
        return next
      })
    },
    [],
  )

  const createNewEncounter = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return

    saveToLocalStorage(encounterGroups, terrainRows, groupTurnActed, activeEncounterId)

    const id = newEncounterId()
    const entry: EncounterIndexEntry = { id, name: trimmed }
    const newGroups = cloneEncounterGroups()
    const newTerrain = cloneTerrainRows()
    const newTurns = newGroups.map(() => false)

    setEncounterIndex((prev) => ({
      ...prev,
      encounters: [...prev.encounters, entry],
      activeId: id,
    }))
    setActiveEncounterId(id)
    setEncounterName(trimmed)
    setEncounterGroups(newGroups)
    setTerrainRows(newTerrain)
    setGroupTurnActed(newTurns)
    prevTurnActedRef.current = [...newTurns]
    setMonsterCardDrawer(null)
    setTerrainDrawerIndex(null)

    for (const t of eotTimersRef.current.values()) clearTimeout(t)
    eotTimersRef.current.clear()
    setEotConfirmed(() => new Map())
    setSeActWindowElapsedGroup(() => new Set())
  }, [encounterGroups, terrainRows, groupTurnActed, activeEncounterId])

  const switchToEncounter = useCallback((targetId: string) => {
    if (targetId === activeEncounterId) return

    saveToLocalStorage(encounterGroups, terrainRows, groupTurnActed, activeEncounterId)

    const loaded = loadFromLocalStorage(targetId)
    const entry = encounterIndex.encounters.find((e) => e.id === targetId)
    if (!entry) return

    if (loaded.ok) {
      setEncounterGroups(loaded.state.encounterGroups)
      setTerrainRows(loaded.state.terrainRows)
      setGroupTurnActed(loaded.state.groupTurnActed)
      prevTurnActedRef.current = [...loaded.state.groupTurnActed]
    } else {
      const newGroups = cloneEncounterGroups()
      const newTerrain = cloneTerrainRows()
      const newTurns = newGroups.map(() => false)
      setEncounterGroups(newGroups)
      setTerrainRows(newTerrain)
      setGroupTurnActed(newTurns)
      prevTurnActedRef.current = [...newTurns]
    }

    setActiveEncounterId(targetId)
    setEncounterName(entry.name)
    setEncounterIndex((prev) => ({ ...prev, activeId: targetId }))
    setMonsterCardDrawer(null)
    setTerrainDrawerIndex(null)

    for (const t of eotTimersRef.current.values()) clearTimeout(t)
    eotTimersRef.current.clear()
    setEotConfirmed(() => new Map())
    setSeActWindowElapsedGroup(() => new Set())
    setShowEncounterSwitcher(false)
  }, [encounterGroups, terrainRows, groupTurnActed, activeEncounterId, encounterIndex])

  const renameEncounter = useCallback((targetId: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setEncounterIndex((prev) => ({
      ...prev,
      encounters: prev.encounters.map((e) =>
        e.id === targetId ? { ...e, name: trimmed } : e,
      ),
    }))
    if (targetId === activeEncounterId) {
      setEncounterName(trimmed)
    }
  }, [activeEncounterId])

  const deleteEncounter = useCallback((targetId: string) => {
    setEncounterIndex((prev) => {
      const remaining = prev.encounters.filter((e) => e.id !== targetId)
      if (remaining.length === 0) return prev

      deleteEncounterFromStorage(targetId)

      if (targetId !== activeEncounterId) {
        return { ...prev, encounters: remaining }
      }

      const nextActive = remaining[0]!
      const loaded = loadFromLocalStorage(nextActive.id)

      if (loaded.ok) {
        setEncounterGroups(loaded.state.encounterGroups)
        setTerrainRows(loaded.state.terrainRows)
        setGroupTurnActed(loaded.state.groupTurnActed)
        prevTurnActedRef.current = [...loaded.state.groupTurnActed]
      } else {
        const newGroups = cloneEncounterGroups()
        const newTerrain = cloneTerrainRows()
        const newTurns = newGroups.map(() => false)
        setEncounterGroups(newGroups)
        setTerrainRows(newTerrain)
        setGroupTurnActed(newTurns)
        prevTurnActedRef.current = [...newTurns]
      }

      setActiveEncounterId(nextActive.id)
      setEncounterName(nextActive.name)
      setMonsterCardDrawer(null)
      setTerrainDrawerIndex(null)

      for (const t of eotTimersRef.current.values()) clearTimeout(t)
      eotTimersRef.current.clear()
      setEotConfirmed(() => new Map())
      setSeActWindowElapsedGroup(() => new Set())

      return { ...prev, encounters: remaining, activeId: nextActive.id }
    })
  }, [activeEncounterId])

  const [renamingEncounterId, setRenamingEncounterId] = useState<string | null>(null)
  const [renameInputValue, setRenameInputValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const startRenamingEncounter = useCallback((entry: EncounterIndexEntry) => {
    setRenamingEncounterId(entry.id)
    setRenameInputValue(entry.name)
  }, [])

  const commitRename = useCallback(() => {
    if (renamingEncounterId && renameInputValue.trim()) {
      renameEncounter(renamingEncounterId, renameInputValue)
    }
    setRenamingEncounterId(null)
  }, [renamingEncounterId, renameInputValue, renameEncounter])

  const cancelRename = useCallback(() => {
    setRenamingEncounterId(null)
  }, [])

  useEffect(() => {
    if (renamingEncounterId) {
      requestAnimationFrame(() => renameInputRef.current?.focus())
    }
  }, [renamingEncounterId])

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (showNewEncounterPrompt) {
      requestAnimationFrame(() => newEncounterInputRef.current?.focus())
    }
  }, [showNewEncounterPrompt])

  useEffect(() => {
    if (!showEncounterSwitcher) {
      setRenamingEncounterId(null)
      setConfirmDeleteId(null)
      return
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (encounterSwitcherRef.current && !encounterSwitcherRef.current.contains(e.target as Node)) {
        setShowEncounterSwitcher(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEncounterSwitcher(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showEncounterSwitcher])

  const patchMinionConditionAddOrSet = useCallback(
    (groupIndex: number, monsterIndex: number, minionIndex: number, label: string, state: ConditionState) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex || !m.minions) return m
              return {
                ...m,
                minions: m.minions.map((minion, mni) => {
                  if (mni !== minionIndex) return minion
                  const idx = minion.conditions.findIndex((c) => c.label === label)
                  if (idx >= 0) {
                    return {
                      ...minion,
                      conditions: minion.conditions.map((c, ci) =>
                        ci === idx ? { ...c, state } : c,
                      ),
                    }
                  }
                  return {
                    ...minion,
                    conditions: [...minion.conditions, { label, state }],
                  }
                }),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchTerrainStamina = useCallback((rowIndex: number, stamina: [number, number]) => {
    setTerrainRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, stamina: [stamina[0], stamina[1]] } : r,
      ),
    )
  }, [])

  const addTerrainRow = useCallback((row: TerrainRowState) => {
    setTerrainRows((prev) => [...prev, row])
  }, [])

  const deleteTerrainRow = useCallback((rowIndex: number) => {
    setTerrainRows((prev) => prev.filter((_, i) => i !== rowIndex))
    setTerrainDrawerIndex((prev) => {
      if (prev === null) return null
      if (prev === rowIndex) return null
      if (prev > rowIndex) return prev - 1
      return prev
    })
  }, [])

  const duplicateTerrainRow = useCallback((rowIndex: number) => {
    setTerrainRows((prev) => {
      const src = prev[rowIndex]
      if (!src) return prev
      const copy: TerrainRowState = {
        ...src,
        stamina: [src.stamina[0], src.stamina[1]],
        upgrades: src.upgrades ? [...src.upgrades] : src.upgrades,
      }
      const next = [...prev]
      next.splice(rowIndex + 1, 0, copy)
      return next
    })
    setTerrainDrawerIndex((prev) => {
      if (prev == null) return prev
      if (prev > rowIndex) return prev + 1
      return prev
    })
  }, [])

  const reorderTerrainRows = useCallback((from: number, to: number) => {
    if (from === to) return
    setTerrainRows((prev) => moveIndexInArray(prev, from, to))
    setTerrainDrawerIndex((prev) => {
      if (prev === null) return null
      if (prev === from) return to
      if (from < to) {
        if (prev > from && prev <= to) return prev - 1
      } else {
        if (prev >= to && prev < from) return prev + 1
      }
      return prev
    })
  }, [])

  const toggleTerrainDrawer = useCallback((rowIndex: number) => {
    setTerrainDrawerIndex((prev) => {
      if (prev === rowIndex) {
        if (prefersReducedMotion()) return null
        setDrawerAnimatingOut(true)
        return prev
      }
      setDrawerAnimatingOut(false)
      setMonsterCardDrawer(null)
      return rowIndex
    })
  }, [])

  const addTerrainUpgrade = useCallback((rowIndex: number, upgradeName: string) => {
    setTerrainRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r
        const cur = r.upgrades ?? []
        if (cur.includes(upgradeName)) return r
        return { ...r, upgrades: [...cur, upgradeName] }
      }),
    )
  }, [])

  const removeTerrainUpgrade = useCallback((rowIndex: number, upgradeName: string) => {
    setTerrainRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r
        const cur = r.upgrades ?? []
        if (!cur.includes(upgradeName)) return r
        return { ...r, upgrades: cur.filter((u) => u !== upgradeName) }
      }),
    )
  }, [])

  const patchGroupColor = useCallback((groupIndex: number, newColor: GroupColorId) => {
    setEncounterGroups((prev) => {
      const otherIdx = prev.findIndex((g, i) => i !== groupIndex && g.color === newColor)
      if (otherIdx < 0) {
        return prev.map((g, i) => (i === groupIndex ? { ...g, color: newColor } : g))
      }
      const oldColor = prev[groupIndex]?.color
      if (oldColor === undefined) {
        return prev
      }
      return prev.map((g, i) => {
        if (i === groupIndex) {
          return { ...g, color: newColor }
        }
        if (i === otherIdx) {
          return { ...g, color: oldColor }
        }
        return g
      })
    })
  }, [])

  const toggleGroupTurn = useCallback((gi: number) => {
    setGroupTurnActed((prev) => {
      const next = [...prev]
      next[gi] = !next[gi]
      return next
    })
  }, [])

  const resetAllTurns = useCallback(() => {
    setGroupTurnActed((prev) => prev.map(() => false))
  }, [])

  const toggleMonsterCard = useCallback(
    (groupIndex: number, monsterIndex: number, view: MonsterCardDrawerView) => {
      const m = encounterGroups[groupIndex]?.monsters[monsterIndex]
      if (!m || (m.features?.length ?? 0) === 0) return
      if (view.kind === 'minion') {
        if (!m.minions || view.slot < 0 || view.slot >= m.minions.length) return
      }
      if (view.kind === 'minionParent' && (!m.minions || m.minions.length === 0)) return
      const prev = monsterCardDrawerRef.current
      if (
        prev != null &&
        prev.groupIndex === groupIndex &&
        prev.monsterIndex === monsterIndex &&
        monsterCardDrawerViewEquals(prev.view, view)
      ) {
        if (prefersReducedMotion()) {
          setMonsterCardDrawer(null)
        } else {
          setDrawerAnimatingOut(true)
        }
        return
      }
      setDrawerAnimatingOut(false)
      setMonsterCardDrawer({ groupIndex, monsterIndex, view })
      setTerrainDrawerIndex(null)
    },
    [encounterGroups],
  )

  const requestDrawerClose = useCallback(() => {
    if (prefersReducedMotion()) {
      setMonsterCardDrawer(null)
      setTerrainDrawerIndex(null)
      return
    }
    setDrawerAnimatingOut(true)
  }, [])

  useEffect(() => {
    if (!monsterCardDrawer) return
    const m = encounterGroups[monsterCardDrawer.groupIndex]?.monsters[monsterCardDrawer.monsterIndex]
    if (!m || (m.features?.length ?? 0) === 0) {
      setMonsterCardDrawer(null)
      return
    }
    const { view } = monsterCardDrawer
    if (view.kind === 'minion') {
      if (!m.minions || view.slot < 0 || view.slot >= m.minions.length) {
        setMonsterCardDrawer(null)
      }
    } else if (view.kind === 'minionParent' && (!m.minions || m.minions.length === 0)) {
      setMonsterCardDrawer(null)
    }
  }, [encounterGroups, monsterCardDrawer])

  const anyDrawerOpen = monsterCardDrawer != null || terrainDrawerIndex != null

  useLayoutEffect(() => {
    if (!anyDrawerOpen) {
      setDrawerEntered(false)
      prevDrawerForEnterRef.current = null
      return
    }
    if (drawerAnimatingOut) return

    const hadPrevious = prevDrawerForEnterRef.current != null || terrainDrawerIndex != null
    prevDrawerForEnterRef.current = monsterCardDrawer

    if (hadPrevious) {
      setDrawerEntered(true)
      return
    }

    if (prefersReducedMotion()) {
      setDrawerEntered(true)
      return
    }
    setDrawerEntered(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerEntered(true))
    })
    return () => cancelAnimationFrame(id)
  }, [anyDrawerOpen, monsterCardDrawer, terrainDrawerIndex, drawerAnimatingOut])

  useEffect(() => {
    if (!drawerAnimatingOut) return
    const t = window.setTimeout(() => {
      setMonsterCardDrawer(null)
      setTerrainDrawerIndex(null)
      setDrawerAnimatingOut(false)
    }, MONSTER_DRAWER_CLOSE_MS)
    return () => clearTimeout(t)
  }, [drawerAnimatingOut])

  useEffect(() => {
    if (monsterCardDrawer == null && terrainDrawerIndex == null) {
      setDrawerAnimatingOut(false)
    }
  }, [monsterCardDrawer, terrainDrawerIndex])

  const drawerMonster =
    monsterCardDrawer != null
      ? encounterGroups[monsterCardDrawer.groupIndex]?.monsters[monsterCardDrawer.monsterIndex]
      : undefined
  const drawerFeatures = drawerMonster?.features
  const statCardDrawerOpen = drawerMonster != null && (drawerFeatures?.length ?? 0) > 0
  const drawerGroupColor =
    monsterCardDrawer != null
      ? encounterGroups[monsterCardDrawer.groupIndex]?.color
      : undefined
  const drawerOrdinalBadge =
    drawerGroupColor != null ? GROUP_COLOR_BADGE[drawerGroupColor] : null

  const drawerView = monsterCardDrawer?.view
  const drawerOrdinalInCircle: number | null =
    statCardDrawerOpen && monsterCardDrawer != null && drawerView != null
      ? drawerView.kind === 'standard'
        ? monsterCardDrawer.monsterIndex + 1
        : drawerView.kind === 'minion'
          ? drawerView.slot + 1
          : null
      : null

  const drawerTitleName =
    statCardDrawerOpen && drawerMonster != null && drawerView != null
      ? drawerView.kind === 'minion'
        ? (drawerMonster.minions?.[drawerView.slot]?.name ?? drawerMonster.name)
        : drawerMonster.name
      : ''

  const drawerAsideAriaLabel =
    statCardDrawerOpen && drawerMonster != null && drawerView != null
      ? drawerView.kind === 'minionParent'
        ? `Stat card for ${drawerMonster.name}`
        : drawerView.kind === 'minion'
          ? `Stat card for minion ${drawerView.slot + 1}: ${drawerTitleName}`
          : drawerOrdinalInCircle != null
            ? `Stat card for creature ${drawerOrdinalInCircle}: ${drawerTitleName}`
            : `Stat card for ${drawerTitleName}`
      : undefined

  const terrainDrawerRow =
    terrainDrawerIndex != null ? terrainRows[terrainDrawerIndex] : undefined
  const terrainDrawerOpen =
    terrainDrawerRow != null && terrainDrawerRow.terrainName != null

  return (
    <div className="min-h-svh bg-zinc-950 p-4 font-serif text-zinc-100 antialiased md:p-8">
      <div className="mx-auto flex w-full max-w-[min(92rem,100%)] items-stretch gap-0">
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl">
            <header className="px-4 pt-5 pb-0 text-center">
              <h1 className="text-lg font-normal uppercase tracking-[0.2em] text-white md:text-xl">
                Live Steel
              </h1>
              <div className="relative mt-1.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  aria-label="Switch encounter"
                  aria-expanded={showEncounterSwitcher}
                  onClick={() => setShowEncounterSwitcher((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[0.65rem] font-normal uppercase tracking-[0.28em] text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                >
                  {encounterName}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
                {showEncounterSwitcher && (
                  <div
                    ref={encounterSwitcherRef}
                    role="listbox"
                    aria-label="Select encounter"
                    className="absolute top-full z-20 mt-1 max-h-72 min-w-[14rem] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
                  >
                    {encounterIndex.encounters.map((entry) => (
                      <div key={entry.id} className="group/entry relative flex items-center">
                        {renamingEncounterId === entry.id ? (
                          <div className="flex w-full items-center gap-1 px-2 py-1">
                            <input
                              ref={renameInputRef}
                              type="text"
                              value={renameInputValue}
                              onChange={(e) => setRenameInputValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename()
                                if (e.key === 'Escape') cancelRename()
                              }}
                              onBlur={commitRename}
                              aria-label="Rename encounter"
                              className="min-w-0 flex-1 rounded border border-zinc-600 bg-zinc-800 px-1.5 py-1 font-sans text-xs text-zinc-100 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                            />
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              role="option"
                              aria-selected={entry.id === activeEncounterId}
                              onClick={() => switchToEncounter(entry.id)}
                              className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 pl-3 pr-1 text-left font-sans text-xs transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/60 ${
                                entry.id === activeEncounterId
                                  ? 'text-amber-400'
                                  : 'text-zinc-300'
                              }`}
                            >
                              {entry.id === activeEncounterId ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden>
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="inline-block h-3.5 w-3.5 shrink-0" aria-hidden />
                              )}
                              <span className="min-w-0 truncate">{entry.name}</span>
                            </button>
                            <div className="flex shrink-0 items-center gap-0.5 pr-1.5 opacity-0 transition-opacity group-hover/entry:opacity-100 focus-within:opacity-100">
                              <button
                                type="button"
                                aria-label={`Rename encounter "${entry.name}"`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startRenamingEncounter(entry)
                                }}
                                className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700/80 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/60"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                                  <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                                </svg>
                              </button>
                              {encounterIndex.encounters.length > 1 && (
                                confirmDeleteId === entry.id ? (
                                  <button
                                    type="button"
                                    aria-label={`Confirm delete encounter "${entry.name}"`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteEncounter(entry.id)
                                      setConfirmDeleteId(null)
                                    }}
                                    onBlur={() => setConfirmDeleteId(null)}
                                    className="cursor-pointer rounded px-1.5 py-0.5 font-sans text-[0.6rem] font-medium text-red-400 transition-colors hover:bg-red-950/60 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/60"
                                  >
                                    Delete?
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={`Delete encounter "${entry.name}"`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDeleteId(entry.id)
                                    }}
                                    className="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-700/80 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/60"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                )
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Create new encounter"
                  onClick={() => {
                    setNewEncounterNameInput('')
                    setShowNewEncounterPrompt(true)
                    setShowEncounterSwitcher(false)
                  }}
                  className="inline-flex cursor-pointer items-center rounded-md px-1.5 py-0.5 font-sans text-[0.6rem] uppercase tracking-[0.15em] text-zinc-500 transition-colors hover:bg-zinc-800/70 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-0.5 h-3 w-3">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  New
                </button>
              </div>
              {showNewEncounterPrompt && (
                <div className="mx-auto mt-2 flex max-w-xs items-center gap-2 font-sans" role="dialog" aria-label="Name new encounter">
                  <input
                    ref={newEncounterInputRef}
                    type="text"
                    value={newEncounterNameInput}
                    onChange={(e) => setNewEncounterNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEncounterNameInput.trim()) {
                        createNewEncounter(newEncounterNameInput)
                        setShowNewEncounterPrompt(false)
                      }
                      if (e.key === 'Escape') {
                        setShowNewEncounterPrompt(false)
                      }
                    }}
                    placeholder="Encounter name…"
                    aria-label="Encounter name"
                    className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    disabled={!newEncounterNameInput.trim()}
                    onClick={() => {
                      createNewEncounter(newEncounterNameInput)
                      setShowNewEncounterPrompt(false)
                    }}
                    className="cursor-pointer rounded-md bg-amber-600/80 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-500/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewEncounterPrompt(false)}
                    aria-label="Cancel new encounter"
                    className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <TitleRule flushBelow />
            </header>

            <section aria-label="Creature tracker" className="mt-0 flex flex-col gap-2 px-0">
              <div
                className="grid w-full min-w-0 items-center"
                style={{ gridTemplateColumns: ROSTER_GRID_TEMPLATE }}
              >
                <div className="flex justify-center py-1.5" style={{ gridColumn: 1 }}>
                  <button
                    type="button"
                    onClick={resetAllTurns}
                    aria-label="Start a new turn: reset all encounter group turn diamonds to pending"
                    className="min-h-10 min-w-[5.25rem] cursor-pointer rounded-md px-4 py-2 font-sans text-xs tracking-wide text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                  >
                    New turn
                  </button>
                </div>
                <div className="flex justify-end py-1.5 pr-1 sm:pr-2" style={{ gridColumn: '2 / -1' }}>
                  <button
                    type="button"
                    aria-pressed={uiLocked}
                    onClick={() => setUiLocked((v) => !v)}
                    aria-label={
                      uiLocked
                        ? 'Unlock encounter editing controls'
                        : 'Lock encounter editing controls'
                    }
                    className="min-h-10 min-w-[5.25rem] cursor-pointer rounded-md px-4 py-2 font-sans text-xs tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 bg-zinc-800/85 text-zinc-100 hover:bg-zinc-700/90 hover:text-white aria-pressed:bg-transparent aria-pressed:text-zinc-400 aria-pressed:hover:bg-zinc-900 aria-pressed:hover:text-zinc-200"
                  >
                    {uiLocked ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              </div>
              {encounterGroups.map((group, gi) => (
                <div
                  key={group.id}
                  data-testid="encounter-group-drop-target"
                  data-group-index={gi}
                  className={`rounded-lg transition-[box-shadow] duration-150 ${
                    dropTargetGroupIndex === gi ? 'ring-2 ring-amber-500/45 ring-offset-2 ring-offset-zinc-950' : ''
                  }`}
                  onDragOver={(e) => {
                    if (![...e.dataTransfer.types].includes(ENCOUNTER_GROUP_DRAG_MIME)) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDropTargetGroupIndex(gi)
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setDropTargetGroupIndex((v) => (v === gi ? null : v))
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDropTargetGroupIndex(null)
                    const raw = e.dataTransfer.getData(ENCOUNTER_GROUP_DRAG_MIME)
                    const from = Number.parseInt(raw, 10)
                    if (Number.isNaN(from) || from === gi) return
                    reorderEncounterGroups(from, gi)
                  }}
                >
                  <GroupSection
                    group={group}
                    groupKey={`g${gi}`}
                    groupNumber={gi + 1}
                    thisGroupIndex={gi}
                    encounterGroupColors={encounterGroups.map((g) => g.color)}
                    turnActed={groupTurnActed[gi] ?? false}
                    seActPhaseGlow={
                      (groupTurnActed[gi] ?? false) && !seActWindowElapsedGroup.has(gi)
                    }
                    onToggleTurn={() => toggleGroupTurn(gi)}
                    turnAriaLabel={`Encounter group ${gi + 1}: turn ${groupTurnActed[gi] ? 'acted' : 'pending'}`}
                    onGroupColorChange={(c) => patchGroupColor(gi, c)}
                    onMonsterStaminaChange={(mi, st) => patchMonsterStamina(gi, mi, st)}
                    onMonsterConditionRemove={(mi, ci) => patchMonsterConditionRemove(gi, mi, ci)}
                    onMonsterConditionAddOrSet={(mi, label, state) =>
                      patchMonsterConditionAddOrSet(gi, mi, label, state)
                    }
                    allGroups={encounterGroups}
                    onMinionCaptainChange={(mi, captainId) =>
                      patchMinionCaptain(gi, mi, captainId)
                    }
                    onMinionDeadChange={(mi, mni, dead) =>
                      patchMinionDead(gi, mi, mni, dead)
                    }
                    onMinionConditionRemove={(mi, mni, ci) =>
                      patchMinionConditionRemove(gi, mi, mni, ci)
                    }
                    onMinionConditionAddOrSet={(mi, mni, label, state) =>
                      patchMinionConditionAddOrSet(gi, mi, mni, label, state)
                    }
                    onDeleteMonster={
                      uiLocked ? undefined : (mi) => deleteMonster(gi, mi)
                    }
                    onDuplicateMonster={
                      uiLocked ? undefined : (mi) => duplicateMonster(gi, mi)
                    }
                    onDeleteMinion={
                      uiLocked ? undefined : (mi, mni) => deleteMinionFromHorde(gi, mi, mni)
                    }
                    onDuplicateMinion={
                      uiLocked ? undefined : (mi, mni) => duplicateMinionFromHorde(gi, mi, mni)
                    }
                    onConvertMonsterToSquad={
                      uiLocked ? undefined : (mi) => convertMonsterToSquad(gi, mi)
                    }
                    onDeleteEncounterGroup={
                      uiLocked ? undefined : () => deleteEncounterGroup(gi)
                    }
                    onDuplicateEncounterGroup={
                      uiLocked ? undefined : () => duplicateEncounterGroup(gi)
                    }
                    duplicateEncounterGroupDisabled={!canAddGroup}
                    onAddMonster={
                      uiLocked ? undefined : (monster) => addMonsterToGroup(gi, monster)
                    }
                    onConfirmEot={(mi, label, minionIndex) =>
                      confirmEotCondition(gi, mi, label, minionIndex)
                    }
                    isEotConfirmed={(mi, label, minionIndex) =>
                      isEotConfirmed(gi, mi, label, minionIndex)
                    }
                    encounterGroupDragHandle={
                      uiLocked
                        ? undefined
                        : {
                            onDragStart: (e) => {
                              e.dataTransfer.setData(ENCOUNTER_GROUP_DRAG_MIME, String(gi))
                              e.dataTransfer.effectAllowed = 'move'
                            },
                            onDragEnd: () => setDropTargetGroupIndex(null),
                            ariaLabel: `Reorder encounter group ${gi + 1}`,
                          }
                    }
                    monsterDrag={
                      uiLocked
                        ? undefined
                        : {
                            thisGroupIndex: gi,
                            dropTarget: monsterDropTarget,
                            dropRejectFlash: monsterDropRejectFlash,
                            onMonsterDragStart: (mi, e, fromMinion) =>
                              onMonsterDragStart(gi, mi, e, fromMinion),
                            onMonsterDragEnd: onMonsterDragEnd,
                            onMonsterDragOver: (mi, mni, e) => onMonsterDragOver(gi, mi, mni, e),
                            onMonsterDragLeave: (mi, mni, e) => onMonsterDragLeave(gi, mi, mni, e),
                            onMonsterDrop: (mi, mni, e) => onMonsterDrop(gi, mi, mni, e),
                          }
                    }
                    conditionDrag={{
                      dropTarget: conditionDropTarget,
                      onDragStart: (mi, mni, label, e) => onConditionDragStart(gi, mi, mni, label, e),
                      onDragEnd: onConditionDragEnd,
                      onDragOver: (mi, mni, e) => onConditionDragOver(gi, mi, mni, e),
                      onDragLeave: (mi, mni, e) => onConditionDragLeave(gi, mi, mni, e),
                      onDrop: (mi, mni, e) => onConditionDrop(gi, mi, mni, e),
                    }}
                    monsterCardDrawer={monsterCardDrawer}
                    onToggleMonsterCard={(mi, view) => toggleMonsterCard(gi, mi, view)}
                  />
                </div>
              ))}
              {!uiLocked && (
                <button
                  type="button"
                  onClick={addNewGroup}
                  aria-label="Add new encounter group"
                  disabled={!canAddGroup}
                  aria-disabled={!canAddGroup}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 font-sans text-sm tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 ${
                    canAddGroup
                      ? 'cursor-pointer border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200'
                      : 'cursor-not-allowed border-zinc-800 text-zinc-600 opacity-60'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  Add group
                </button>
              )}
            </section>

            <section aria-label="Dynamic terrain" className="mt-8 flex flex-col gap-2 md:mt-10">
              <header className="px-4 pt-2 pb-0 text-center md:pt-3">
                <h2 className="text-lg font-normal uppercase tracking-[0.2em] text-white md:text-xl">
                  Dynamic Terrain
                </h2>
                <TitleRule />
              </header>
              {terrainRows.map((row, i) => (
                <div
                  key={i}
                  className={`rounded-lg transition-[box-shadow] duration-150 ${
                    dropTargetTerrainIndex === i ? 'ring-2 ring-amber-500/45 ring-offset-2 ring-offset-zinc-950' : ''
                  }`}
                  onDragOver={(e) => {
                    if (![...e.dataTransfer.types].includes(TERRAIN_DRAG_MIME)) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                    setDropTargetTerrainIndex(i)
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setDropTargetTerrainIndex((v) => (v === i ? null : v))
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDropTargetTerrainIndex(null)
                    const raw = e.dataTransfer.getData(TERRAIN_DRAG_MIME)
                    const from = Number.parseInt(raw, 10)
                    if (Number.isNaN(from) || from === i) return
                    reorderTerrainRows(from, i)
                  }}
                >
                  <TerrainRow
                    row={row}
                    rowIndex={i}
                    onStaminaChange={(st) => patchTerrainStamina(i, st)}
                    onClick={() => toggleTerrainDrawer(i)}
                    isDrawerOpen={terrainDrawerIndex === i}
                    uiLocked={uiLocked}
                    onDelete={uiLocked ? undefined : () => deleteTerrainRow(i)}
                    onDuplicate={uiLocked ? undefined : () => duplicateTerrainRow(i)}
                    onAddUpgrade={uiLocked ? undefined : (name) => addTerrainUpgrade(i, name)}
                    onRemoveUpgrade={uiLocked ? undefined : (name) => removeTerrainUpgrade(i, name)}
                    dragHandle={
                      uiLocked
                        ? undefined
                        : {
                            onDragStart: (e) => {
                              e.dataTransfer.setData(TERRAIN_DRAG_MIME, String(i))
                              e.dataTransfer.effectAllowed = 'move'
                            },
                            onDragEnd: (_e: DragEvent) => setDropTargetTerrainIndex(null),
                            ariaLabel: `Reorder terrain ${i + 1}`,
                          }
                    }
                  />
                </div>
              ))}
              {!uiLocked && (
                <AddTerrainButton onAdd={addTerrainRow} />
              )}
            </section>
          </div>
        </div>

        <div
          className={`sticky top-4 z-10 shrink-0 self-start overflow-hidden md:top-8 ${
            anyDrawerOpen ? DRAWER_PANEL_W_CLASS : 'w-0'
          }`}
        >
          {anyDrawerOpen && (
            <aside
              id="stat-card-drawer"
              aria-label={
                terrainDrawerOpen && terrainDrawerRow
                  ? `Stat block for ${terrainDrawerRow.object}`
                  : drawerAsideAriaLabel
              }
              aria-hidden={!statCardDrawerOpen && !terrainDrawerOpen}
              className={`box-border flex h-[calc(100svh-2rem)] ${DRAWER_PANEL_W_CLASS} flex-col overflow-hidden bg-zinc-950 transition-transform duration-300 ease-out motion-reduce:transition-none md:h-[calc(100svh-4rem)] ${
                drawerEntered && !drawerAnimatingOut ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {terrainDrawerOpen && terrainDrawerRow ? (
                <div className="box-border flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden font-sans">
                  <div className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-800/60 px-3 py-2.5">
                    <h2 className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium tracking-wide">
                      <span className="min-w-0 truncate text-zinc-200">{terrainDrawerRow.object}</span>
                    </h2>
                    <button
                      type="button"
                      aria-label="Close stat card drawer"
                      onClick={requestDrawerClose}
                      className="shrink-0 cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden>
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-4 pt-2">
                    <TerrainStatBlock
                      terrainName={terrainDrawerRow.terrainName!}
                      activeUpgrades={terrainDrawerRow.upgrades ?? []}
                    />
                  </div>
                </div>
              ) : statCardDrawerOpen && drawerMonster ? (
                <div className="box-border flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden font-sans">
                  <div className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-800/60 px-3 py-2.5">
                    <h2 className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium tracking-wide">
                      {drawerOrdinalBadge != null ? (
                        <span
                          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold tabular-nums leading-none ${drawerOrdinalBadge.border} ${drawerOrdinalBadge.bg} ${drawerOrdinalBadge.text}`}
                        >
                          {drawerOrdinalInCircle != null ? drawerOrdinalInCircle : '\u00a0'}
                        </span>
                      ) : null}
                      <span className="min-w-0 truncate text-zinc-200">{drawerTitleName}</span>
                    </h2>
                    <button
                      type="button"
                      aria-label="Close stat card drawer"
                      onClick={requestDrawerClose}
                      className="shrink-0 cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5" aria-hidden>
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-4 pt-2">
                    <StatBlock
                      features={drawerFeatures ?? []}
                      monsterName={drawerMonster.name}
                      encounterGroupColor={drawerGroupColor}
                    />
                  </div>
                </div>
              ) : null}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
