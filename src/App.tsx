import { useCallback, useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { CaptainRef, ConditionState, GroupColorId, Monster } from './types'
import {
  cloneEncounterGroups,
  cloneTerrainRows,
  CONDITION_DRAG_MIME,
  ENCOUNTER_GROUP_DRAG_MIME,
  ENCOUNTER_GROUPS,
  MONSTER_DRAG_MIME,
  moveIndexInArray,
  moveMonsterInEncounterWithCaptainRemap,
  newEncounterGroupId,
  nextAvailableColor,
  parseConditionDragPayload,
  remapEncounterGroupIndex,
  remapEotConfirmedAfterMonsterMove,
  reorderEncounterGroupsWithCaptainRemap,
  ROSTER_GRID_TEMPLATE,
  transferConditionBetweenCreatures,
  type ConditionCreatureRef,
} from './data'
import { TitleRule } from './components/TitleRule'
import { GroupSection } from './components/GroupSection'
import { TerrainRow } from './components/TerrainRow'

function App() {
  const [encounterGroups, setEncounterGroups] = useState(cloneEncounterGroups)
  const [terrainRows, setTerrainRows] = useState(cloneTerrainRows)

  const [groupTurnActed, setGroupTurnActed] = useState(() =>
    ENCOUNTER_GROUPS.map(() => false),
  )
  const [uiLocked, setUiLocked] = useState(false)

  const eotTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const [seActWindowElapsedGroup, setSeActWindowElapsedGroup] = useState<Set<number>>(() => new Set())
  const [eotConfirmed, setEotConfirmed] = useState<Map<number, Set<string>>>(() => new Map())
  const eotConfirmedLatest = useRef(eotConfirmed)
  eotConfirmedLatest.current = eotConfirmed
  const prevTurnActedRef = useRef<boolean[]>(ENCOUNTER_GROUPS.map(() => false))

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
            monsters: g.monsters.map((m, mi) =>
              mi === monsterIndex ? { ...m, stamina: [stamina[0], stamina[1]] } : m,
            ),
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
              return {
                ...m,
                minions: m.minions.map((minion, mni) =>
                  mni === minionIndex ? { ...minion, dead } : minion,
                ),
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
  const [monsterDropTarget, setMonsterDropTarget] = useState<{
    groupIndex: number
    monsterIndex: number
  } | null>(null)

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

  const onMonsterDragStart = useCallback((fromG: number, fromM: number, e: DragEvent) => {
    e.dataTransfer.setData(
      MONSTER_DRAG_MIME,
      JSON.stringify({ fromGroup: fromG, fromMonster: fromM }),
    )
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const onMonsterDragEnd = useCallback(() => {
    setMonsterDropTarget(null)
  }, [])

  const onMonsterDragOver = useCallback((toG: number, toM: number, e: DragEvent) => {
    if (![...e.dataTransfer.types].includes(MONSTER_DRAG_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setMonsterDropTarget({ groupIndex: toG, monsterIndex: toM })
  }, [])

  const onMonsterDragLeave = useCallback((toG: number, toM: number, e: DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setMonsterDropTarget((v) =>
        v?.groupIndex === toG && v?.monsterIndex === toM ? null : v,
      )
    }
  }, [])

  const onMonsterDrop = useCallback(
    (toG: number, toM: number, e: DragEvent) => {
      e.preventDefault()
      setMonsterDropTarget(null)
      const raw = e.dataTransfer.getData(MONSTER_DRAG_MIME)
      let payload: { fromGroup: number; fromMonster: number } | null = null
      try {
        const o = JSON.parse(raw) as { fromGroup?: unknown; fromMonster?: unknown }
        if (
          typeof o.fromGroup === 'number' &&
          typeof o.fromMonster === 'number' &&
          Number.isInteger(o.fromGroup) &&
          Number.isInteger(o.fromMonster)
        ) {
          payload = { fromGroup: o.fromGroup, fromMonster: o.fromMonster }
        }
      } catch {
        /* ignore */
      }
      if (!payload) return
      moveMonsterInEncounter(payload.fromGroup, payload.fromMonster, toG, toM)
    },
    [moveMonsterInEncounter],
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
    setEncounterGroups((prev) => {
      const color = nextAvailableColor(prev.map((g) => g.color))
      return [...prev, { id: newEncounterGroupId(), monsters: [], color }]
    })
    setGroupTurnActed((prev) => [...prev, false])
  }, [])

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

  return (
    <div className="min-h-svh bg-zinc-950 p-4 font-serif text-zinc-100 antialiased md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="px-4 pt-5 pb-0 text-center">
          <h1 className="text-lg font-normal tracking-[0.2em] text-white md:text-xl">
            Live Steel
          </h1>
          <p className="mt-1.5 text-[0.65rem] font-normal uppercase tracking-[0.28em] text-zinc-400">
            Encounter roster
          </p>
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
                aria-label="Reset all encounter group turn diamonds to pending"
                className="min-h-10 min-w-[5.25rem] cursor-pointer rounded-md px-4 py-2 font-sans text-xs tracking-wide text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
              >
                Reset
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
                onDeleteMonster={(mi) => deleteMonster(gi, mi)}
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
                        onMonsterDragStart: (mi, e) => onMonsterDragStart(gi, mi, e),
                        onMonsterDragEnd: onMonsterDragEnd,
                        onMonsterDragOver: (mi, e) => onMonsterDragOver(gi, mi, e),
                        onMonsterDragLeave: (mi, e) => onMonsterDragLeave(gi, mi, e),
                        onMonsterDrop: (mi, e) => onMonsterDrop(gi, mi, e),
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
              />
            </div>
          ))}
          {!uiLocked && (
            <button
              type="button"
              onClick={addNewGroup}
              aria-label="Add new encounter group"
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-3 font-sans text-sm tracking-wide text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
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
            <h2 className="text-lg font-normal tracking-[0.2em] text-white md:text-xl">
              DYNAMIC TERRAIN
            </h2>
            <TitleRule />
          </header>
          {terrainRows.map((row, i) => (
            <TerrainRow key={i} row={row} onStaminaChange={(st) => patchTerrainStamina(i, st)} />
          ))}
        </section>
      </div>
    </div>
  )
}

export default App
