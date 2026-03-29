import { useCallback, useState } from 'react'
import type { CaptainRef, ConditionState, GroupColorId } from './types'
import {
  cloneEncounterGroups,
  cloneTerrainRows,
  ENCOUNTER_GROUPS,
  ROSTER_GRID_TEMPLATE,
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
    setGroupTurnActed(ENCOUNTER_GROUPS.map(() => false))
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
          </div>
          {encounterGroups.map((group, gi) => (
            <GroupSection
              key={`encounter-group-${gi}`}
              group={group}
              groupKey={`g${gi}`}
              groupNumber={gi + 1}
              thisGroupIndex={gi}
              encounterGroupColors={encounterGroups.map((g) => g.color)}
              turnActed={groupTurnActed[gi] ?? false}
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
            />
          ))}
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
