import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { CONDITION_DRAG_MIME, MONSTER_DRAG_MIME } from './data'

function mockMonsterDataTransfer(): DataTransfer {
  const store = new Map<string, string>()
  const types: string[] = []
  return {
    effectAllowed: 'uninitialized',
    dropEffect: 'none' as const,
    get types() {
      return types as unknown as DOMStringList
    },
    setData(type: string, v: string) {
      store.set(type, v)
      if (!types.includes(type)) types.push(type)
    },
    getData(type: string) {
      return store.get(type) ?? ''
    },
  } as unknown as DataTransfer
}

async function chooseDeleteFromEncounterRowGrip(
  user: ReturnType<typeof userEvent.setup>,
  monsterName: string,
) {
  await user.click(screen.getByRole('button', { name: `Reorder ${monsterName} within encounter` }))
  await user.click(screen.getByTestId('grip-menu-delete'))
}

/** Accessible names use `Encounter group ${n}: …`; avoid `/group 1/` matching `group 10`. */
const turnButton = (n: number, state: 'pending' | 'acted') =>
  new RegExp(`^Encounter group ${n}: turn ${state}$`, 'i')

describe('App', () => {
  it('renders app name, encounter roster tagline, and terrain section title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /^Live Steel$/i })).toBeInTheDocument()
    expect(screen.getByText(/^Encounter roster$/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dynamic terrain/i })).toBeInTheDocument()
  })

  it('lists creature tracker and terrain landmarks', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: 'Creature tracker' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dynamic terrain' })).toBeInTheDocument()
  })

  it('shows roster rows with names, stamina, characteristics, and conditions', () => {
    render(<App />)
    const tracker = screen.getByRole('region', { name: 'Creature tracker' })
    expect(screen.getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Level 1 · Horde Ambusher')).toBeInTheDocument()
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
    expect(within(tracker).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(within(tracker).getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()
    expect(screen.getByText('Minotaur Sunderer', { exact: true })).toBeInTheDocument()
    const minotaurGrid = screen.getByText('Minotaur Sunderer', { exact: true }).closest(
      'div.grid.items-stretch.rounded-lg',
    ) as HTMLElement
    expect(
      within(minotaurGrid).getByRole('button', { name: /^Remove Bleeding$/i }),
    ).toBeInTheDocument()
  })

  it('renders MARIP characteristic headers and numeric row for the first creature in its group', () => {
    render(<App />)
    const nameEl = screen.getByText('Goblin Assassin 1', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    for (const letter of ['M', 'A', 'R', 'I', 'P']) {
      expect(scope.getAllByText(letter).length).toBeGreaterThanOrEqual(1)
    }
    expect(scope.getAllByText('-2').length).toBeGreaterThanOrEqual(1)
    const firstMarip = scope.getAllByRole('group', { name: /^Characteristics \(MARIP\)$/i })[0]
    expect(firstMarip).toBeTruthy()
    expect(within(firstMarip as HTMLElement).getByText('2')).toBeInTheDocument()
  })

  it('shows stamina from bestiary for Goblin Stinker', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Stinker$/i })
    expect(within(staminaGroup).getByText('10 / 10')).toBeInTheDocument()
  })

  it('shows all condition icons dimmed when a creature has none active', () => {
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })
    expect(within(reserveConditions).getByRole('button', { name: /^Add Weakened$/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(within(reserveConditions).getByTitle('Weakened (inactive)')).toBeInTheDocument()
  })

  it('removes a creature condition when its icon is clicked while active', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    const scope = within(goblinConditions)
    expect(scope.getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()

    await user.click(scope.getByRole('button', { name: /^Remove Weakened$/i }))

    expect(scope.getByRole('button', { name: /^Add Weakened$/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()
  })

  it('toggles creature condition on icon click (inactive adds neutral, active removes)', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    const scope = within(goblinConditions)

    await user.click(scope.getByRole('button', { name: /^Remove Slowed$/i }))
    expect(scope.getByRole('button', { name: /^Add Slowed$/i })).toBeInTheDocument()

    await user.click(scope.getByRole('button', { name: /^Add Slowed$/i }))
    expect(scope.getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()
    expect(scope.getByTitle('Slowed (neutral)')).toBeInTheDocument()
  })

  it('renders terrain objects, notes, stamina, and condition icon strip', () => {
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    expect(
      within(terrain).getByText(
        'Toppled barricade — light cover along the eastern lane.',
        { exact: true },
      ),
    ).toBeInTheDocument()
    expect(
      within(terrain).getByText('Burning; end of round 1d4 to adjacent.', { exact: true }),
    ).toBeInTheDocument()
    expect(within(terrain).getByTitle('Slowed (neutral)')).toBeInTheDocument()
    expect(within(terrain).getByTitle('Weakened (neutral)')).toBeInTheDocument()
    expect(
      within(terrain).getByText('Ritual circle (inactive). Chalk smeared, runes still warm.', {
        exact: true,
      }),
    ).toBeInTheDocument()
    expect(within(terrain).getByTitle('Marked (neutral)')).toBeInTheDocument()
  })

  it('toggles per-group turn diamond via Turn column and updates aria state', async () => {
    const user = userEvent.setup()
    render(<App />)

    const group1 = screen.getByRole('button', { name: turnButton(1, 'pending') })
    expect(group1).toHaveAttribute('aria-pressed', 'false')

    await user.click(group1)
    expect(group1).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: turnButton(1, 'acted') })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))
    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reset clears all group turn states', async () => {
    const user = userEvent.setup()
    render(<App />)

    const g1 = screen.getByRole('button', { name: turnButton(1, 'pending') })
    const g2 = screen.getByRole('button', { name: turnButton(2, 'pending') })
    await user.click(g1)
    await user.click(g2)
    expect(g1).toHaveAttribute('aria-pressed', 'true')

    await user.click(
      screen.getByRole('button', { name: /Reset all encounter group turn diamonds to pending/i }),
    )

    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: turnButton(2, 'pending') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('shows stamina editor on hover and applies +1 from the step control', async () => {
    const user = userEvent.setup()
    render(<App />)

    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    const dialog = within(staminaGroup).getByRole('dialog', {
      name: /Edit stamina for Goblin Assassin 1 — adjust values/i,
    })
    expect(dialog).toHaveClass('opacity-0')

    await user.hover(staminaGroup)

    await user.click(
      within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }),
    )
    expect(screen.getByText('6 / 15')).toBeInTheDocument()
  })

  it('opens add-condition dialog from cell keyboard and adds neutral condition from name', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    expect(within(reserveConditions).getByRole('button', { name: /^Add Frightened$/i })).toBeInTheDocument()
    reserveConditions.focus()
    await user.keyboard('{Enter}')

    const picker = await screen.findByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })
    // Frightened — avoids clashing with Dazed on Minotaur Sunderer in the same encounter group.
    await user.click(
      within(picker).getByRole('button', { name: /^Add Frightened as neutral on Goblin Stinker$/i }),
    )

    expect(within(reserveConditions).getByRole('button', { name: /^Remove Frightened$/i })).toBeInTheDocument()
    expect(within(reserveConditions).getByTitle('Frightened (neutral)')).toBeInTheDocument()
  })

  it('adds EoT and SE from picker duration controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Marked as end of turn on Goblin Stinker$/i }),
    )

    expect(scope.getByTitle('Marked (End of turn)')).toBeInTheDocument()

    const markedEot = within(picker).getByRole('button', {
      name: /^Remove Marked \(end of turn\) from Goblin Stinker$/i,
    })
    expect(markedEot.className).toMatch(/amber/)

    await user.click(
      within(picker).getByRole('button', { name: /^Add Prone as save ends on Goblin Stinker$/i }),
    )
    expect(scope.getByTitle('Prone (Save ends)')).toBeInTheDocument()
  })

  // --- Stamina editor: decrease & boundary clamping ---

  it('decreases stamina by 1 via the step control', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i }))
    expect(screen.getByText('4 / 15')).toBeInTheDocument()
  })

  it('decreases stamina by 10 via the step control', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 10$/i }))
    expect(screen.getByText('0 / 15')).toBeInTheDocument()
  })

  it('clamps stamina at zero when decreasing past 0', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    const minusOne = within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i })
    for (let i = 0; i < 7; i++) {
      await user.click(minusOne)
    }
    expect(screen.getByText('0 / 15')).toBeInTheDocument()
  })

  it('increases stamina by 10 and caps at max', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 10$/i }))
    expect(within(staminaGroup).getByText('15 / 15')).toBeInTheDocument()
  })

  it('caps stamina at max even with +1 when already at max', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Underboss$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(within(staminaGroup).getByText('15 / 15')).toBeInTheDocument()
  })

  // --- Stamina glyph states ---

  it('shows healthy heart when stamina is above half', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Underboss$/i })
    const hearts = within(staminaGroup).getAllByRole('img', { name: /Healthy/i })
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows winded heart when stamina is at or below half', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    const hearts = within(staminaGroup).getAllByRole('img', { name: /Winded/i })
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('shows skull icon when stamina reaches 0', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 10$/i }))
    const skulls = within(staminaGroup).getAllByRole('img', { name: /Dead/i })
    expect(skulls.length).toBeGreaterThanOrEqual(1)
  })

  it('shows dash for zero/zero stamina on terrain with no pool', () => {
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    const staminaGroup = within(terrain).getByRole('group', {
      name: /^Edit stamina for terrain: Ritual circle/i,
    })
    expect(within(staminaGroup).getByText('—')).toBeInTheDocument()
    expect(within(staminaGroup).queryByRole('img', { name: /Healthy|Winded|Dead/i })).toBeNull()
  })

  it('positive delta on 0/0 stamina creates new max equal to delta', async () => {
    const user = userEvent.setup()
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    const staminaGroup = within(terrain).getByRole('group', {
      name: /^Edit stamina for terrain: Ritual circle/i,
    })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 10$/i }))
    expect(within(staminaGroup).getByText('10 / 10')).toBeInTheDocument()
  })

  // --- Turn diamonds: group independence ---

  it('toggling group 3 turn does not affect groups 1, 2, or 4', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: turnButton(3, 'pending') }))
    expect(screen.getByRole('button', { name: turnButton(3, 'acted') })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: turnButton(2, 'pending') })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: turnButton(4, 'pending') })).toHaveAttribute('aria-pressed', 'false')
  })

  it('all four group turn buttons are present', () => {
    render(<App />)
    for (let g = 1; g <= 4; g++) {
      expect(screen.getByRole('button', { name: turnButton(g, 'pending') })).toBeInTheDocument()
    }
  })

  // --- Reset preserves non-turn state ---

  it('reset clears turns but preserves stamina and condition changes', async () => {
    const user = userEvent.setup()
    render(<App />)

    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(screen.getByText('6 / 15')).toBeInTheDocument()

    const goblinConditions = screen.getByRole('group', { name: /^Conditions for Goblin Assassin 1\./i })
    await user.click(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i }))

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: /Reset all encounter group turn diamonds to pending/i }))

    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('6 / 15')).toBeInTheDocument()
    expect(within(goblinConditions).getByRole('button', { name: /^Add Weakened$/i })).toBeInTheDocument()
  })

  // --- Condition picker: Escape closes ---

  it('closes the condition picker dialog on Escape', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })).toBeNull()
  })

  // --- Condition picker: re-opening and selecting a second condition ---

  it('adds a condition via picker name button (neutral), then adds a second via another open', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Bleeding as neutral on Goblin Stinker$/i }),
    )
    expect(within(reserveConditions).getByTitle('Bleeding (neutral)')).toBeInTheDocument()

    await user.click(
      within(picker).getByRole('button', { name: /^Add Surprised as neutral on Goblin Stinker$/i }),
    )
    expect(within(reserveConditions).getByTitle('Surprised (neutral)')).toBeInTheDocument()
    expect(within(reserveConditions).getByTitle('Bleeding (neutral)')).toBeInTheDocument()
  })

  // --- Condition icon strip: all 12 rendered ---

  it('renders all 12 condition icons for each creature', () => {
    render(<App />)
    const conditionLabels = [
      'Bleeding', 'Dazed', 'Frightened', 'Grabbed', 'Judged', 'Marked',
      'Prone', 'Restrained', 'Slowed', 'Surprised', 'Taunted', 'Weakened',
    ]
    const nameEl = screen.getByText('Goblin Assassin 1', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const goblinConditions = within(groupGrid).getByRole('group', { name: /^Conditions for Goblin Assassin 1\./i })
    for (const label of conditionLabels) {
      expect(within(goblinConditions).getByTitle(new RegExp(`^${label}`))).toBeInTheDocument()
    }
  })

  // --- Condition isolation between creatures in the same group ---

  it('removing a condition on one creature does not affect another in the same group', async () => {
    const user = userEvent.setup()
    render(<App />)
    const sentinelGrid = screen.getByText('Minotaur Sunderer', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const sentinelScope = within(sentinelGrid)
    const sentinelConditions = sentinelScope.getByRole('group', { name: /^Conditions for Minotaur Sunderer\./i })
    const echoConditions = sentinelScope.getByRole('group', { name: /^Conditions for Gnoll Cackler\./i })

    expect(within(sentinelConditions).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
    expect(within(echoConditions).getByRole('button', { name: /^Remove Restrained$/i })).toBeInTheDocument()

    await user.click(within(sentinelConditions).getByRole('button', { name: /^Remove Bleeding$/i }))

    expect(within(sentinelConditions).getByRole('button', { name: /^Add Bleeding$/i })).toBeInTheDocument()
    expect(within(echoConditions).getByRole('button', { name: /^Remove Restrained$/i })).toBeInTheDocument()
  })

  // --- Terrain stamina editing ---

  it('edits terrain stamina via +1 and -1 controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    const terrainStamina = within(terrain).getByRole('group', { name: /^Edit stamina for terrain: Toppled barricade/i })
    expect(within(terrainStamina).getByText('6 / 8')).toBeInTheDocument()

    await user.hover(terrainStamina)
    await user.click(within(terrainStamina).getByRole('button', { name: /^Decrease stamina by 1$/i }))
    expect(within(terrainStamina).getByText('5 / 8')).toBeInTheDocument()

    await user.click(within(terrainStamina).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(within(terrainStamina).getByText('6 / 8')).toBeInTheDocument()
  })

  // --- Terrain conditions are non-interactive ---

  it('terrain condition icons are not buttons (non-interactive)', () => {
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    const slowedImg = within(terrain).getByTitle('Slowed (neutral)')
    expect(slowedImg.closest('button')).toBeNull()
    expect(slowedImg.closest('[role="img"]')).toBeInTheDocument()
  })

  // --- All creatures rendered with correct data ---

  it('renders all expected creature names across all encounter groups', () => {
    render(<App />)
    const expectedNames = [
      'Goblin Assassin 1', 'Goblin Warrior', 'Goblin Underboss',
      'Minions', 'Minotaur Sunderer', 'Gnoll Cackler', 'Goblin Stinker',
    ]
    for (const name of expectedNames) {
      expect(screen.getByText(name, { exact: true })).toBeInTheDocument()
    }
  })

  it('renders creature subtitles', () => {
    render(<App />)
    expect(screen.getByText('Level 1 · Horde Ambusher')).toBeInTheDocument()
    expect(screen.getByText('Level 1 · Horde Harrier')).toBeInTheDocument()
    expect(screen.getByText('Level 1 · Horde Support')).toBeInTheDocument()
    expect(screen.getByText('Level 1 · Minion Brute')).toBeInTheDocument()
    expect(screen.getByText('Level 3 · Elite Brute')).toBeInTheDocument()
    expect(screen.getByText('Level 2 · Horde Hexer')).toBeInTheDocument()
    expect(screen.getByText('Level 1 · Horde Controller')).toBeInTheDocument()
  })

  it('renders FS/SPD/Stab stat headers', () => {
    render(<App />)
    expect(screen.getAllByTitle('Free strike').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTitle('Speed').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTitle('Stability').length).toBeGreaterThanOrEqual(1)
  })

  // --- MARIP characteristics for multiple creatures ---

  it('renders MARIP values for Minotaur Sunderer (2, 1, 0, 2, -1)', () => {
    render(<App />)
    const nameEl = screen.getByText('Minotaur Sunderer', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const maripGroups = scope.getAllByRole('group', { name: /^Characteristics \(MARIP\)$/i })
    const sentinelMarip = within(maripGroups[0] as HTMLElement)
    expect(sentinelMarip.getAllByText('2').length).toBe(2)
    expect(sentinelMarip.getByText('-1')).toBeInTheDocument()
    expect(sentinelMarip.getByText('0')).toBeInTheDocument()
    expect(sentinelMarip.getByText('1')).toBeInTheDocument()
  })

  // --- Stamina transition from healthy to winded ---

  it('transitions from healthy to winded heart when stamina drops to half', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Warrior$/i })
    expect(within(staminaGroup).getAllByRole('img', { name: /Healthy/i }).length).toBeGreaterThanOrEqual(1)

    await user.hover(staminaGroup)
    const minus1 = within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i })
    for (let i = 0; i < 8; i++) {
      await user.click(minus1)
    }
    expect(screen.getByText('7 / 15')).toBeInTheDocument()
    expect(within(staminaGroup).getAllByRole('img', { name: /Winded/i }).length).toBeGreaterThanOrEqual(1)
  })

  // --- Toggling condition via icon strip re-adds as neutral ---

  it('re-adds a removed condition as neutral via the icon strip', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', { name: /^Conditions for Goblin Assassin 1\./i })
    const scope = within(goblinConditions)

    await user.click(scope.getByRole('button', { name: /^Remove Weakened$/i }))
    expect(scope.getByRole('button', { name: /^Add Weakened$/i })).toBeInTheDocument()

    await user.click(scope.getByRole('button', { name: /^Add Weakened$/i }))
    expect(scope.getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(scope.getByTitle('Weakened (neutral)')).toBeInTheDocument()
  })

  // --- Condition picker: EoT overwrites neutral, SE overwrites EoT ---

  it('changing condition duration from neutral to EoT via picker updates the display', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Assassin 1', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const goblinConditions = scope.getByRole('group', { name: /^Conditions for Goblin Assassin 1\./i })

    expect(within(goblinConditions).getByTitle('Weakened (neutral)')).toBeInTheDocument()

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }))

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
  })

  it('changing condition duration from EoT to SE via picker updates the display', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })
    await user.click(within(picker).getByRole('button', { name: /^Add Dazed as end of turn on Goblin Stinker$/i }))
    expect(within(reserveConditions).getByTitle('Dazed (End of turn)')).toBeInTheDocument()

    await user.click(within(picker).getByRole('button', { name: /^Add Dazed as save ends on Goblin Stinker$/i }))
    expect(within(reserveConditions).getByTitle('Dazed (Save ends)')).toBeInTheDocument()
  })

  // --- Accessibility: aria-expanded on condition cell ---

  it('sets aria-expanded on the condition cell when picker opens and closes', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    expect(reserveConditions).toHaveAttribute('aria-expanded', 'false')

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    expect(reserveConditions).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(reserveConditions).toHaveAttribute('aria-expanded', 'false')
  })

  // --- Space key also opens/closes condition picker ---

  it('opens condition picker with Space key', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Stinker', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Goblin Stinker/i })

    reserveConditions.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: /^Add condition to Goblin Stinker$/i })).toBeInTheDocument()
  })

  // --- Group color picker opens ---

  it('opens group color picker on ordinal badge click', async () => {
    const user = userEvent.setup()
    render(<App />)
    const badge = screen.getByRole('button', {
      name: /^Encounter group 1: creature 1 of 2\. Group color Red\. Activate to change group color\.$/i,
    })
    expect(badge).toHaveAttribute('aria-expanded', 'false')
    await user.click(badge)
    expect(badge).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: /^Choose color for encounter group 1$/i })).toBeInTheDocument()
  })

  it('closes group color picker on second ordinal badge click', async () => {
    const user = userEvent.setup()
    render(<App />)
    const badge = screen.getByRole('button', {
      name: /^Encounter group 1: creature 1 of 2\. Group color Red\. Activate to change group color\.$/i,
    })
    await user.click(badge)
    expect(screen.getByRole('dialog', { name: /^Choose color for encounter group 1$/i })).toBeInTheDocument()
    await user.click(badge)
    expect(screen.queryByRole('dialog', { name: /^Choose color for encounter group 1$/i })).toBeNull()
  })

  it('group color picker lists all 10 color options', async () => {
    const user = userEvent.setup()
    render(<App />)
    const badge = screen.getByRole('button', {
      name: /^Encounter group 1: creature 1 of 2\. Group color Red\. Activate to change group color\.$/i,
    })
    await user.click(badge)
    const picker = screen.getByRole('dialog', { name: /^Choose color for encounter group 1$/i })
    const colorNames = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'White', 'Grey', 'Black']
    for (const color of colorNames) {
      expect(within(picker).getByText(color)).toBeInTheDocument()
    }
  })

  // --- Multiple stamina edits compound correctly ---

  it('multiple stamina edits compound: +1 then -1 returns to original', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(screen.getByText('6 / 15')).toBeInTheDocument()
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i }))
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
  })

  // --- Terrain second row data ---

  it('renders second terrain row with its note and condition', () => {
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    expect(within(terrain).getByText('Anyone ending turn inside tests Stability (15+).')).toBeInTheDocument()
    expect(within(terrain).getByTitle('Marked (neutral)')).toBeInTheDocument()
  })

  // --- Stamina editor dialog hidden by default ---

  it('stamina editor overlay is hidden before hover', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    const dialog = within(staminaGroup).getByRole('dialog', {
      name: /Edit stamina for Goblin Assassin 1 — adjust values/i,
    })
    expect(dialog).toHaveClass('opacity-0')
  })

  // --- Goblin Warrior initial stamina ---

  it('shows correct initial stamina for Goblin Warrior', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Warrior$/i })
    expect(within(staminaGroup).getByText('15 / 15')).toBeInTheDocument()
  })

  // --- Gnoll Cackler initial conditions ---

  it('shows Restrained condition active on Gnoll Cackler', () => {
    render(<App />)
    const sentinelGrid = screen.getByText('Gnoll Cackler', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const echoConditions = within(sentinelGrid).getByRole('group', { name: /^Conditions for Gnoll Cackler\./i })
    expect(within(echoConditions).getByRole('button', { name: /^Remove Restrained$/i })).toBeInTheDocument()
    expect(within(echoConditions).getByTitle('Restrained (neutral)')).toBeInTheDocument()
  })

  // --- Terrain stamina clamped at max ---

  it('terrain stamina cannot exceed max', async () => {
    const user = userEvent.setup()
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    const terrainStamina = within(terrain).getByRole('group', { name: /^Edit stamina for terrain: Toppled barricade/i })

    await user.hover(terrainStamina)
    await user.click(within(terrainStamina).getByRole('button', { name: /^Increase stamina by 10$/i }))
    expect(within(terrainStamina).getByText('8 / 8')).toBeInTheDocument()
  })

  // --- Condition on Goblin Underboss ---

  it('Goblin Underboss has Judged condition active', () => {
    render(<App />)
    const grid = screen.getByText('Goblin Underboss', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const conditions = within(grid).getByRole('group', { name: /^Conditions for Goblin Underboss\./i })
    expect(within(conditions).getByRole('button', { name: /^Remove Judged$/i })).toBeInTheDocument()
  })

  // --- Condition on Minions ---

  it('Minions have Taunted condition active', () => {
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const conditions = within(grid).getByRole('group', { name: /^Conditions for Minions\./i })
    expect(within(conditions).getByRole('button', { name: /^Remove Taunted$/i })).toBeInTheDocument()
  })

  // --- Minotaur Sunderer has both Bleeding and Dazed ---

  it('Minotaur Sunderer has both Bleeding and Dazed conditions active', () => {
    render(<App />)
    const grid = screen.getByText('Minotaur Sunderer', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const conditions = within(grid).getByRole('group', { name: /^Conditions for Minotaur Sunderer\./i })
    expect(within(conditions).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
    expect(within(conditions).getByRole('button', { name: /^Remove Dazed$/i })).toBeInTheDocument()
  })

  // --- Removing all conditions leaves all icons as "Add" ---

  it('removing all conditions on a creature leaves all icons as Add buttons', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = screen.getByText('Goblin Underboss', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const conditions = within(grid).getByRole('group', { name: /^Conditions for Goblin Underboss\./i })

    await user.click(within(conditions).getByRole('button', { name: /^Remove Judged$/i }))

    expect(within(conditions).getByRole('button', { name: /^Add Judged$/i })).toBeInTheDocument()
    const allButtons = within(conditions).getAllByRole('button')
    for (const btn of allButtons) {
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    }
  })

  // --- Terrain zero/zero stamina shows dash ---

  it('terrain with zero/zero stamina shows dash', () => {
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    const ritualStamina = within(terrain).getByRole('group', {
      name: /^Edit stamina for terrain: Ritual circle/i,
    })
    expect(within(ritualStamina).getByText('—')).toBeInTheDocument()
  })

  // --- Reset button is always visible ---

  it('reset button is present on initial render', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Reset all encounter group turn diamonds to pending/i })).toBeInTheDocument()
  })

  it('lock mode hides group and monster grab handles and add-monster controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getAllByLabelText(/^Reorder encounter group \d+$/i).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByLabelText(/^Add monster to group$/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Lock encounter editing controls/i }))
    expect(screen.getByRole('button', { name: /Unlock encounter editing controls/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryAllByLabelText(/^Reorder encounter group \d+$/i)).toHaveLength(0)
    expect(screen.queryAllByLabelText(/Reorder .* within encounter/i)).toHaveLength(0)
    expect(screen.queryAllByLabelText(/^Add monster to group$/i)).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Add new encounter group/i })).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('grip-menu-delete')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: /Unlock encounter editing controls/i }))
    expect(screen.getAllByLabelText(/^Reorder encounter group \d+$/i).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByLabelText(/^Add monster to group$/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Add new encounter group/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reorder Goblin Warrior within encounter' }))
    expect(screen.getByTestId('grip-menu-delete')).toBeInTheDocument()
    await user.keyboard('{Escape}')
  })

  // --- Group ordinal badges show correct numbers per group ---

  it('group 4 shows ordinal badges 1, 2, 3 for its three creatures', () => {
    render(<App />)
    const grid = screen.getByText('Minotaur Sunderer', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    expect(scope.getByRole('button', { name: /creature 1 of 3/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /creature 2 of 3/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /creature 3 of 3/i })).toBeInTheDocument()
  })

  // --- Minion dead/alive toggle (MINION-003) ---

  const minionGroupGrid = () =>
    screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement

  it('minion child rows default to alive state', () => {
    render(<App />)
    const grid = minionGroupGrid()
    const scope = within(grid)
    const toggles = scope.getAllByRole('button', { name: /Goblin Spinecleaver [1-4]: alive/i })
    expect(toggles).toHaveLength(4)
    for (const toggle of toggles) {
      expect(toggle).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('clicking the dead/alive toggle marks a minion as dead', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = minionGroupGrid()
    const scope = within(grid)
    const toggle = scope.getByRole('button', { name: /Goblin Spinecleaver 1: alive/i })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(scope.getByRole('button', { name: /Goblin Spinecleaver 1: dead/i })).toBeInTheDocument()
  })

  it('toggling a minion dead applies visual dimming and strikethrough', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = minionGroupGrid()
    const scope = within(grid)
    const toggle = scope.getByRole('button', { name: /Goblin Spinecleaver 2: alive/i })
    await user.click(toggle)
    const nameEl = scope.getByText('Goblin Spinecleaver 2', { exact: true })
    expect(nameEl.className).toMatch(/line-through/)
  })

  it('toggling a dead minion back to alive removes visual state', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = minionGroupGrid()
    const scope = within(grid)
    const toggle = scope.getByRole('button', { name: /Goblin Spinecleaver 1: alive/i })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    const nameEl = scope.getByText('Goblin Spinecleaver 1', { exact: true })
    expect(nameEl.className).not.toMatch(/line-through/)
  })

  it('minion life toggle updates accessible name when marked dead', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = minionGroupGrid()
    const scope = within(grid)
    expect(scope.getAllByRole('button', { name: /Goblin Spinecleaver \d+: alive/i })).toHaveLength(4)
    expect(scope.queryByRole('button', { name: /Goblin Spinecleaver 3: dead/i })).toBeNull()
    await user.click(scope.getByRole('button', { name: /Goblin Spinecleaver 3: alive/i }))
    expect(scope.getAllByRole('button', { name: /Goblin Spinecleaver \d+: alive/i })).toHaveLength(3)
    expect(scope.getByRole('button', { name: /Goblin Spinecleaver 3: dead/i })).toBeInTheDocument()
  })

  it('dead minion toggle does not affect other minions in the group', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = minionGroupGrid()
    const scope = within(grid)
    await user.click(scope.getByRole('button', { name: /Goblin Spinecleaver 1: alive/i }))
    const otherToggles = [
      scope.getByRole('button', { name: /Goblin Spinecleaver 2: alive/i }),
      scope.getByRole('button', { name: /Goblin Spinecleaver 3: alive/i }),
      scope.getByRole('button', { name: /Goblin Spinecleaver 4: alive/i }),
    ]
    for (const t of otherToggles) {
      expect(t).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('minion child rows render life control in stamina column (col 3)', () => {
    render(<App />)
    const toggles = screen.getAllByRole('button', { name: /Goblin Spinecleaver \d+: alive/i })
    expect(toggles.length).toBeGreaterThanOrEqual(4)
  })

  // --- Minion interval stamina display (MINION-004) ---

  it('minion group shows interval thresholds instead of standard stamina display', () => {
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    const staminaPool = scope.getByRole('group', { name: /Minion stamina pool/i })
    expect(staminaPool).toBeInTheDocument()
    expect(within(staminaPool).getByTestId('threshold-5')).toHaveTextContent('5')
    expect(within(staminaPool).getByTestId('threshold-10')).toHaveTextContent('10')
    expect(within(staminaPool).getByTestId('threshold-15')).toHaveTextContent('15')
    expect(within(staminaPool).getByTestId('threshold-20')).toHaveTextContent('20')
  })

  it('minion interval thresholds show healthy state when pool is full', () => {
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    for (const t of [5, 10, 15, 20]) {
      expect(scope.getByTestId(`threshold-${t}`).title).toMatch(/healthy/)
    }
  })

  it('minion interval thresholds update when stamina is decreased', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    const staminaGroup = scope.getByRole('group', { name: /^Edit stamina for Minions$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 10$/i }))
    expect(scope.getByTestId('threshold-5').title).toMatch(/healthy/)
    expect(scope.getByTestId('threshold-10').title).toMatch(/healthy/)
    expect(scope.getByTestId('threshold-15').title).toMatch(/dead/)
    expect(scope.getByTestId('threshold-20').title).toMatch(/dead/)
  })

  it('non-minion monsters still use standard stamina display', () => {
    render(<App />)
    const assassinStam = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    const warriorStam = screen.getByRole('group', { name: /^Edit stamina for Goblin Warrior$/i })
    expect(within(assassinStam).getByText('5 / 15')).toBeInTheDocument()
    expect(within(warriorStam).getByText('15 / 15')).toBeInTheDocument()
  })

  // --- Minion stamina popover with interval editor (MINION-005) ---

  it('minion group popover shows interval segments instead of cur/max inputs', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    const staminaGroup = scope.getByRole('group', { name: /^Edit stamina for Minions$/i })
    await user.hover(staminaGroup)
    const dialog = within(staminaGroup).getByRole('dialog', { name: /adjust values/i })
    const intervals = within(dialog).getByRole('group', { name: /Minion stamina intervals/i })
    expect(intervals).toBeInTheDocument()
    expect(within(intervals).getByTestId('editor-threshold-5')).toHaveTextContent('5')
    expect(within(intervals).getByTestId('editor-threshold-10')).toHaveTextContent('10')
    expect(within(intervals).getByTestId('editor-threshold-15')).toHaveTextContent('15')
    expect(within(intervals).getByTestId('editor-threshold-20')).toHaveTextContent('20')
  })

  it('minion popover does not show cur/max inputs', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    const staminaGroup = scope.getByRole('group', { name: /^Edit stamina for Minions$/i })
    await user.hover(staminaGroup)
    const dialog = within(staminaGroup).getByRole('dialog', { name: /adjust values/i })
    expect(within(dialog).queryByLabelText('Current stamina')).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Max stamina')).not.toBeInTheDocument()
  })

  it('minion popover bump buttons update interval display and thresholds', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    const staminaGroup = scope.getByRole('group', { name: /^Edit stamina for Minions$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 10$/i }))
    expect(scope.getByTestId('threshold-5').title).toMatch(/healthy/)
    expect(scope.getByTestId('threshold-10').title).toMatch(/healthy/)
    expect(scope.getByTestId('threshold-15').title).toMatch(/dead/)
    expect(scope.getByTestId('threshold-20').title).toMatch(/dead/)
  })

  it('non-minion monster popover still uses standard cur/max inputs', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    const dialog = within(staminaGroup).getByRole('dialog', { name: /adjust values/i })
    expect(within(dialog).getByLabelText('Current stamina')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Max stamina')).toBeInTheDocument()
  })

  // --- Captain assignment (MINION-001) ---

  const getMinionGrid = () =>
    screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement

  it('minion group shows an unassigned Captain pill', () => {
    render(<App />)
    const grid = getMinionGrid()
    const pill = within(grid).getByTestId('captain-pill')
    expect(pill).toBeInTheDocument()
    expect(pill).toHaveTextContent(/Captain/i)
  })

  it('clicking the Captain pill opens a dropdown listing non-minion monsters', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    const pill = within(grid).getByRole('button', { name: /Assign captain for Minions/i })
    await user.click(pill)
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    expect(dropdown).toBeInTheDocument()
    expect(within(dropdown).getByText('Goblin Assassin 1')).toBeInTheDocument()
    expect(within(dropdown).getByText('Goblin Warrior')).toBeInTheDocument()
    expect(within(dropdown).getByText('Goblin Underboss')).toBeInTheDocument()
    expect(within(dropdown).getByText('Minotaur Sunderer')).toBeInTheDocument()
    expect(within(dropdown).getByText('Gnoll Cackler')).toBeInTheDocument()
    expect(within(dropdown).getByText('Goblin Stinker')).toBeInTheDocument()
    expect(within(dropdown).queryByText('Minions')).toBeNull()
  })

  it('selecting a monster from the dropdown assigns it as captain', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    await user.click(within(dropdown).getByText('Goblin Underboss'))
    const pill = within(grid).getByTestId('captain-pill')
    expect(pill).toHaveTextContent(/Captain/)
    expect(pill).toHaveTextContent(/Goblin Underboss/)
  })

  it('assigned captain pill shows the captain group colored ordinal', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    await user.click(within(dropdown).getByText('Goblin Underboss'))
    const pill = within(grid).getByTestId('captain-pill')
    expect(pill).toHaveTextContent('1')
    expect(pill).toHaveTextContent('Goblin Underboss')
  })

  it('dropdown closes after selecting a captain', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    expect(within(grid).getByRole('listbox', { name: /Select captain for Minions/i })).toBeInTheDocument()
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    await user.click(within(dropdown).getByText('Goblin Assassin 1'))
    expect(within(grid).queryByRole('listbox')).toBeNull()
  })

  it('assigned captain can be changed by clicking the pill', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(grid).getByText('Goblin Assassin 1'))
    expect(within(grid).getByTestId('captain-pill')).toHaveTextContent('Goblin Assassin 1')
    await user.click(within(grid).getByRole('button', { name: /Change captain for Minions/i }))
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    await user.click(within(dropdown).getByText('Minotaur Sunderer'))
    expect(within(grid).getByTestId('captain-pill')).toHaveTextContent('Minotaur Sunderer')
  })

  it('captain can be removed via the dropdown remove option', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(grid).getByText('Goblin Underboss'))
    expect(within(grid).getByTestId('captain-pill')).toHaveTextContent('Goblin Underboss')
    await user.click(within(grid).getByRole('button', { name: /Change captain for Minions/i }))
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    await user.click(within(dropdown).getByText('Remove captain'))
    const pill = within(grid).getByTestId('captain-pill')
    expect(pill).not.toHaveTextContent('Goblin Underboss')
    expect(within(grid).getByRole('button', { name: /Assign captain for Minions/i })).toBeInTheDocument()
  })

  it('captain dropdown does not list minion group monsters as candidates', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    const dropdown = within(grid).getByRole('listbox', { name: /Select captain for Minions/i })
    const options = within(dropdown).getAllByRole('option')
    const texts = options.map((o) => o.textContent)
    expect(texts.every((t) => !t?.includes('Minions'))).toBe(true)
  })

  // --- Captain removal via x button (MINION-002) ---

  it('assigned captain pill shows an x button for removal', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(grid).getByText('Goblin Underboss'))
    expect(within(grid).getByTestId('remove-captain')).toBeInTheDocument()
    expect(within(grid).getByRole('button', { name: /Remove captain from Minions/i })).toBeInTheDocument()
  })

  it('clicking x button removes the captain and reverts pill to unassigned', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(grid).getByText('Goblin Underboss'))
    expect(within(grid).getByTestId('captain-pill')).toHaveTextContent('Goblin Underboss')
    await user.click(within(grid).getByTestId('remove-captain'))
    const pill = within(grid).getByTestId('captain-pill')
    expect(pill).not.toHaveTextContent('Goblin Underboss')
    expect(within(grid).getByRole('button', { name: /Assign captain for Minions/i })).toBeInTheDocument()
  })

  it('x button is not visible when no captain is assigned', () => {
    render(<App />)
    const grid = getMinionGrid()
    expect(within(grid).queryByTestId('remove-captain')).not.toBeInTheDocument()
  })

  it('after x removal, captain can be reassigned', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = getMinionGrid()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(grid).getByText('Goblin Underboss'))
    await user.click(within(grid).getByTestId('remove-captain'))
    expect(within(grid).getByRole('button', { name: /Assign captain for Minions/i })).toBeInTheDocument()
    await user.click(within(grid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(grid).getByText('Goblin Assassin 1'))
    expect(within(grid).getByTestId('captain-pill')).toHaveTextContent('Goblin Assassin 1')
  })

  // --- Delete monster from group (DATA-003) ---

  it('each top-level creature row exposes delete via the reorder grip menu', async () => {
    const user = userEvent.setup()
    render(<App />)
    const names = [
      'Goblin Assassin 1',
      'Goblin Warrior',
      'Goblin Underboss',
      'Minions',
      'Minotaur Sunderer',
      'Gnoll Cackler',
      'Goblin Stinker',
    ]
    for (const name of names) {
      await user.click(screen.getByRole('button', { name: `Reorder ${name} within encounter` }))
      expect(screen.getByTestId('grip-menu-delete')).toBeInTheDocument()
      await user.keyboard('{Escape}')
    }
  })

  it('clicking delete removes the monster from its group', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('Goblin Warrior', { exact: true })).toBeInTheDocument()
    await chooseDeleteFromEncounterRowGrip(user, 'Goblin Warrior')
    expect(screen.queryByText('Goblin Warrior', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()
  })

  it('deleting a monster updates ordinal badge counts for remaining monsters in the group', async () => {
    const user = userEvent.setup()
    render(<App />)
    const group4grid = screen.getByText('Minotaur Sunderer', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    expect(within(group4grid).getByRole('button', { name: /creature 1 of 3/i })).toBeInTheDocument()
    expect(within(group4grid).getByRole('button', { name: /creature 2 of 3/i })).toBeInTheDocument()
    expect(within(group4grid).getByRole('button', { name: /creature 3 of 3/i })).toBeInTheDocument()

    await chooseDeleteFromEncounterRowGrip(user, 'Gnoll Cackler')

    expect(within(group4grid).getByRole('button', { name: /creature 1 of 2/i })).toBeInTheDocument()
    expect(within(group4grid).getByRole('button', { name: /creature 2 of 2/i })).toBeInTheDocument()
    expect(within(group4grid).queryByRole('button', { name: /creature 3 of/i })).not.toBeInTheDocument()
  })

  it('deleting the last monster in a group removes the entire group', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('Goblin Underboss', { exact: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: turnButton(2, 'pending') })).toBeInTheDocument()

    await chooseDeleteFromEncounterRowGrip(user, 'Goblin Underboss')

    expect(screen.queryByText('Goblin Underboss', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: turnButton(4, 'pending') })).not.toBeInTheDocument()
  })

  it('deleting a captain clears the captain ref on the minion group', async () => {
    const user = userEvent.setup()
    render(<App />)
    const minionGrid = getMinionGrid()
    await user.click(within(minionGrid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(minionGrid).getByText('Goblin Assassin 1'))
    expect(within(minionGrid).getByTestId('captain-pill')).toHaveTextContent('Goblin Assassin 1')

    await chooseDeleteFromEncounterRowGrip(user, 'Goblin Assassin 1')

    const pill = within(minionGrid).getByTestId('captain-pill')
    expect(pill).not.toHaveTextContent('Goblin Assassin 1')
    expect(within(minionGrid).getByRole('button', { name: /Assign captain for Minions/i })).toBeInTheDocument()
  })

  it('deleting a monster before the captain in the same group shifts the captain index', async () => {
    const user = userEvent.setup()
    render(<App />)
    const minionGrid = getMinionGrid()
    await user.click(within(minionGrid).getByRole('button', { name: /Assign captain for Minions/i }))
    await user.click(within(minionGrid).getByText('Goblin Warrior'))
    expect(within(minionGrid).getByTestId('captain-pill')).toHaveTextContent('Goblin Warrior')

    await chooseDeleteFromEncounterRowGrip(user, 'Goblin Assassin 1')

    expect(within(minionGrid).getByTestId('captain-pill')).toHaveTextContent('Goblin Warrior')
  })

  it('deleting a monster in another group does not affect the current group', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Minotaur Sunderer', { exact: true })).toBeInTheDocument()

    await chooseDeleteFromEncounterRowGrip(user, 'Gnoll Cackler')

    expect(screen.getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Minotaur Sunderer', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('Gnoll Cackler', { exact: true })).not.toBeInTheDocument()
  })

  it('deleting a minion group monster removes it and all its child minions', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('Minions', { exact: true })).toBeInTheDocument()

    await chooseDeleteFromEncounterRowGrip(user, 'Minions')

    expect(screen.queryByText('Minions', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('Goblin Spinecleaver 1', { exact: true })).not.toBeInTheDocument()
  })

  it('other monsters remain functional after a deletion', async () => {
    const user = userEvent.setup()
    render(<App />)
    await chooseDeleteFromEncounterRowGrip(user, 'Goblin Stinker')

    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Minotaur Sunderer$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(screen.getByText('9 / 120')).toBeInTheDocument()
  })

  it('solo creature reorder grip offers Convert to Squad and adds a minion row', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Reorder Goblin Warrior within encounter' }))
    await user.click(screen.getByTestId('grip-menu-convert-squad'))
    expect(screen.getByText('Goblin Warrior 1', { exact: true })).toBeInTheDocument()
  })

  it('deletes an encounter group from the turn column grip menu', async () => {
    const user = userEvent.setup()
    render(<App />)
    const initial = screen.getAllByTestId('encounter-group-drop-target').length
    await user.click(screen.getByLabelText(/^Reorder encounter group 2$/i))
    await user.click(screen.getByTestId('grip-menu-delete-group'))
    expect(screen.getAllByTestId('encounter-group-drop-target').length).toBe(initial - 1)
    expect(screen.queryByText('Goblin Underboss', { exact: true })).not.toBeInTheDocument()
  })

  // --- Threshold mismatch cue (MINION-006) ---

  it('no threshold mismatch cue when stamina and dead states are in sync', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Minions$/i })
    expect(within(staminaGroup).queryByTestId('threshold-mismatch-cue')).not.toBeInTheDocument()
  })

  it('shows "Kill" cue when stamina drops below a threshold but minions are still alive', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Minions$/i })
    await user.hover(staminaGroup)
    const dialog = within(staminaGroup).getByRole('dialog', { name: /adjust values/i })
    await user.click(within(dialog).getByRole('button', { name: /^Decrease stamina by 10$/i }))
    const pool = screen.getByRole('group', { name: /Minion stamina pool/i })
    const cue = within(pool).getByTestId('threshold-mismatch-cue')
    expect(cue).toBeInTheDocument()
    expect(cue.textContent).toMatch(/Kill 2/)
  })

  it('threshold cue disappears when dead toggles match suggested count', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Minions$/i })
    await user.hover(staminaGroup)
    const dialog = within(staminaGroup).getByRole('dialog', { name: /adjust values/i })
    await user.click(within(dialog).getByRole('button', { name: /^Decrease stamina by 10$/i }))
    await user.unhover(staminaGroup)

    const toggle3 = screen.getByRole('button', { name: /Goblin Spinecleaver 3: alive/i })
    const toggle4 = screen.getByRole('button', { name: /Goblin Spinecleaver 4: alive/i })
    await user.click(toggle3)
    await user.click(toggle4)

    const pool = screen.getByRole('group', { name: /Minion stamina pool/i })
    expect(within(pool).queryByTestId('threshold-mismatch-cue')).not.toBeInTheDocument()
  })

  // --- Add monster to group (DATA-001) ---

  it('each group has an "Add monster" button', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button', { name: /Add monster to group/i })
    expect(buttons.length).toBe(4)
  })

  it('clicking "Add monster" opens a bestiary search dropdown', async () => {
    const user = userEvent.setup()
    render(<App />)
    const addButtons = screen.getAllByRole('button', { name: /Add monster to group/i })
    await user.click(addButtons[0]!)
    expect(screen.getByRole('textbox', { name: /Search bestiary/i })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: /Available monsters/i })).toBeInTheDocument()
  })

  it('selecting a monster from the picker adds it to the group', async () => {
    const user = userEvent.setup()
    render(<App />)
    const group1grid = screen.getByText('Goblin Assassin 1', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    expect(within(group1grid).queryByText('Troll Whelp', { exact: true })).not.toBeInTheDocument()

    const addBtn = within(group1grid).getByRole('button', { name: /Add monster to group/i })
    await user.click(addBtn)
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.type(input, 'Troll Whelp')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const option = within(listbox).getAllByRole('option').find(
      (el) => el.textContent === 'Troll Whelp',
    )
    expect(option).toBeTruthy()
    await user.click(within(option!).getByRole('button'))

    expect(
      within(group1grid).getByText('Troll Whelp', {
        exact: true,
        selector: 'span.block.truncate',
      }),
    ).toBeInTheDocument()
  })

  it('added monster has correct ordinal and stamina from bestiary', async () => {
    const user = userEvent.setup()
    render(<App />)
    const group1grid = screen.getByText('Goblin Assassin 1', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement

    const addBtn = within(group1grid).getByRole('button', { name: /Add monster to group/i })
    await user.click(addBtn)
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.type(input, 'Troll Whelp')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const option = within(listbox).getAllByRole('option').find(
      (el) => el.textContent === 'Troll Whelp',
    )
    await user.click(within(option!).getByRole('button'))

    expect(within(group1grid).getByRole('button', { name: /creature 3 of 3/i })).toBeInTheDocument()
  })

  it('added monster is fully functional (stamina, conditions)', async () => {
    const user = userEvent.setup()
    render(<App />)
    const group2grid = screen.getByText('Goblin Underboss', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement

    await user.click(within(group2grid).getByRole('button', { name: /Add monster to group/i }))
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.type(input, 'Goblin Sniper')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const option = within(listbox).getAllByRole('option').find(
      (el) => el.textContent === 'Goblin Sniper',
    )
    await user.click(within(option!).getByRole('button'))

    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Sniper$/i })
    expect(group2grid.contains(staminaGroup)).toBe(true)
    await user.hover(staminaGroup)
    const dialog = within(staminaGroup).getByRole('dialog', { name: /adjust values/i })
    await user.click(within(dialog).getByRole('button', { name: /^Decrease stamina by 1$/i }))
  })

  // --- Create new blank group (DATA-002) ---

  it('shows an "Add new encounter group" button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Add new encounter group/i })).toBeInTheDocument()
  })

  it('clicking "Add group" creates a new empty encounter group', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('button', { name: turnButton(5, 'pending') })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))

    expect(screen.getByRole('button', { name: turnButton(5, 'pending') })).toBeInTheDocument()
  })

  it('new empty group has an "Add monster" button', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))
    const addButtons = screen.getAllByRole('button', { name: /Add monster to group/i })
    expect(addButtons.length).toBe(5)
  })

  it('new group gets a distinct color not used by existing groups', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))
    const badge5 = screen.getByRole('button', { name: turnButton(5, 'pending') })
    expect(badge5).toBeInTheDocument()
  })

  it('adding a monster to the new empty group makes it fully functional', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))

    const addButtons = screen.getAllByRole('button', { name: /Add monster to group/i })
    const newGroupAddBtn = addButtons[addButtons.length - 1]!
    await user.click(newGroupAddBtn)
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.type(input, 'Troll Whelp')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const option = within(listbox).getAllByRole('option').find(
      (el) => el.textContent === 'Troll Whelp',
    )
    expect(option).toBeTruthy()
    await user.click(within(option!).getByRole('button'))

    expect(
      screen.getByText('Troll Whelp', { exact: true, selector: 'span.block.truncate' }),
    ).toBeInTheDocument()
  })

  it('new group turn toggle works independently', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))

    const g5 = screen.getByRole('button', { name: turnButton(5, 'pending') })
    await user.click(g5)
    expect(screen.getByRole('button', { name: turnButton(5, 'acted') })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute('aria-pressed', 'false')
  })

  it('reset clears turn state of newly added groups too', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))
    const g5 = screen.getByRole('button', { name: turnButton(5, 'pending') })
    await user.click(g5)
    expect(screen.getByRole('button', { name: turnButton(5, 'acted') })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /Reset all encounter group turn diamonds to pending/i }))

    expect(screen.getByRole('button', { name: turnButton(5, 'pending') })).toHaveAttribute('aria-pressed', 'false')
  })

  it('multiple new groups can be created', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))
    await user.click(screen.getByRole('button', { name: /Add new encounter group/i }))

    expect(screen.getByRole('button', { name: turnButton(5, 'pending') })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: turnButton(6, 'pending') })).toBeInTheDocument()
  })

  // --- Turn toggle preserves conditions (TURN-004) ---

  it('toggling a group from acted back to pending preserves all monster conditions', async () => {
    const user = userEvent.setup()
    render(<App />)

    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    expect(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(within(goblinConditions).getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    expect(screen.getByRole('button', { name: turnButton(1, 'acted') })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))
    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toBeInTheDocument()

    expect(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(within(goblinConditions).getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()
  })

  it('toggling a group back to pending preserves EoT and SE condition states', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )
    await user.click(
      within(picker).getByRole('button', { name: /^Add Slowed as save ends on Goblin Assassin 1$/i }),
    )
    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
    expect(within(goblinConditions).getByTitle('Slowed (Save ends)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
    expect(within(goblinConditions).getByTitle('Slowed (Save ends)')).toBeInTheDocument()
  })

  it('toggling a group back to pending does not affect conditions in other groups', async () => {
    const user = userEvent.setup()
    render(<App />)

    const sentinelGrid = screen.getByText('Minotaur Sunderer', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const sentinelConditions = within(sentinelGrid).getByRole('group', {
      name: /^Conditions for Minotaur Sunderer\./i,
    })
    expect(within(sentinelConditions).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
    expect(within(sentinelConditions).getByRole('button', { name: /^Remove Dazed$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    expect(within(sentinelConditions).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
    expect(within(sentinelConditions).getByRole('button', { name: /^Remove Dazed$/i })).toBeInTheDocument()
  })

  it('toggling a group back to pending preserves minion child conditions', async () => {
    const user = userEvent.setup()
    render(<App />)

    const grid = minionGroupGrid()

    const spinecleaver2Conditions = within(grid).getByRole('group', {
      name: /^Conditions for Goblin Spinecleaver 2\./i,
    })
    expect(within(spinecleaver2Conditions).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(3, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(3, 'acted') }))

    expect(within(spinecleaver2Conditions).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
  })

  it('toggling a group back to pending preserves stamina values', async () => {
    const user = userEvent.setup()
    render(<App />)

    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i }))
    expect(screen.getByText('4 / 15')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    expect(screen.getByText('4 / 15')).toBeInTheDocument()
  })

  it('recalibrates pool max/current when a minion is marked dead so the threshold cue stays in sync', async () => {
    const user = userEvent.setup()
    render(<App />)

    const toggle4 = screen.getByRole('button', { name: /Goblin Spinecleaver 4: alive/i })
    await user.click(toggle4)

    const pool = screen.getByRole('group', { name: /Minion stamina pool: 15 of 20/i })
    expect(within(pool).queryByTestId('threshold-mismatch-cue')).not.toBeInTheDocument()
  })

  // --- EoT/SE condition glow animation on turn acted (TURN-001) ---

  it('EoT condition icon glows when group turn is set to acted', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    const eotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(eotIcon.className).not.toContain('animate-glow-eot')

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    expect(eotIcon.className).toContain('animate-glow-eot')
  })

  it('SE condition icon glows when group turn is set to acted', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Slowed as save ends on Goblin Assassin 1$/i }),
    )

    const seIcon = within(goblinConditions).getByTitle('Slowed (Save ends)')
    expect(seIcon.className).not.toContain('animate-glow-se')

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    expect(seIcon.className).toContain('animate-glow-se')
  })

  it('glow animation stops when group turn is toggled back to pending', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    const eotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(eotIcon.className).toContain('animate-glow-eot')

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))
    expect(eotIcon.className).not.toContain('animate-glow-eot')
  })

  it('neutral conditions do not glow when turn is acted', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    const neutralIcon = within(goblinConditions).getByTitle('Weakened (neutral)')
    expect(neutralIcon.className).not.toContain('animate-glow')

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    expect(neutralIcon.className).not.toContain('animate-glow')
  })

  it('glow animation applies to EoT/SE conditions on minion child rows too', async () => {
    const user = userEvent.setup()
    render(<App />)

    const minionConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Spinecleaver 2\./i,
    })
    minionConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Spinecleaver 2$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Goblin Spinecleaver 2$/i }),
    )

    const eotIcon = within(minionConditions).getByTitle('Bleeding (End of turn)')
    expect(eotIcon.className).not.toContain('animate-glow-eot')

    await user.click(screen.getByRole('button', { name: turnButton(3, 'pending') }))
    expect(eotIcon.className).toContain('animate-glow-eot')
  })

  // --- Cancel animations on rapid acted→pending (TURN-005) ---

  it('rapid acted→pending cancels EoT glow animation and preserves the condition', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    const eotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(eotIcon.className).toContain('animate-glow-eot')

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))
    expect(eotIcon.className).not.toContain('animate-glow-eot')
    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
    expect(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
  })

  it('rapid acted→pending cancels SE glow animation and preserves the condition', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Slowed as save ends on Goblin Assassin 1$/i }),
    )

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    const seIcon = within(goblinConditions).getByTitle('Slowed (Save ends)')
    expect(seIcon.className).toContain('animate-glow-se')

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))
    expect(seIcon.className).not.toContain('animate-glow-se')
    expect(within(goblinConditions).getByTitle('Slowed (Save ends)')).toBeInTheDocument()
    expect(within(goblinConditions).getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()
  })

  it('rapid acted→pending preserves both EoT and SE conditions as active simultaneously', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )
    await user.click(
      within(picker).getByRole('button', { name: /^Add Slowed as save ends on Goblin Assassin 1$/i }),
    )

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
    expect(within(goblinConditions).getByTitle('Slowed (Save ends)')).toBeInTheDocument()
    const eotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    const seIcon = within(goblinConditions).getByTitle('Slowed (Save ends)')
    expect(eotIcon.className).not.toContain('animate-glow')
    expect(seIcon.className).not.toContain('animate-glow')
  })

  it('rapid acted→pending preserves stamina and neutral conditions alongside EoT/SE', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    expect(within(goblinConditions).getByTitle('Weakened (neutral)')).toBeInTheDocument()
    expect(screen.getByText('5 / 15')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    expect(within(goblinConditions).getByTitle('Weakened (neutral)')).toBeInTheDocument()
    expect(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
  })

  it('rapid acted→pending on one group does not affect animation state in another group', async () => {
    const user = userEvent.setup()
    render(<App />)

    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker1 = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker1).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    const sentinelGrid = screen.getByText('Minotaur Sunderer', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const sentinelConditions = within(sentinelGrid).getByRole('group', {
      name: /^Conditions for Minotaur Sunderer\./i,
    })
    sentinelConditions.focus()
    await user.keyboard('{Enter}')
    const picker4 = screen.getByRole('dialog', { name: /^Add condition to Minotaur Sunderer$/i })
    await user.click(
      within(picker4).getByRole('button', { name: /^Add Bleeding as end of turn on Minotaur Sunderer$/i }),
    )

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await user.click(screen.getByRole('button', { name: turnButton(4, 'pending') }))

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    const g1EotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(g1EotIcon.className).not.toContain('animate-glow')

    const g4EotIcon = within(sentinelConditions).getByTitle('Bleeding (End of turn)')
    expect(g4EotIcon.className).toContain('animate-glow-eot')
  })

  it('glow does not affect conditions in other groups', async () => {
    const user = userEvent.setup()
    render(<App />)

    const group1Conditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    group1Conditions.focus()
    await user.keyboard('{Enter}')
    const picker1 = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker1).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    const sentinelGrid = screen.getByText('Minotaur Sunderer', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const sentinelConditions = within(sentinelGrid).getByRole('group', {
      name: /^Conditions for Minotaur Sunderer\./i,
    })
    sentinelConditions.focus()
    await user.keyboard('{Enter}')
    const picker4 = screen.getByRole('dialog', { name: /^Add condition to Minotaur Sunderer$/i })
    await user.click(
      within(picker4).getByRole('button', { name: /^Add Bleeding as end of turn on Minotaur Sunderer$/i }),
    )

    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))

    const g1EotIcon = within(group1Conditions).getByTitle('Weakened (End of turn)')
    expect(g1EotIcon.className).toContain('animate-glow-eot')

    const g4EotIcon = within(sentinelConditions).getByTitle('Bleeding (End of turn)')
    expect(g4EotIcon.className).not.toContain('animate-glow-eot')
  })

  // --- Auto-disable EoT conditions after 30 seconds (TURN-002) ---

  // --- Auto-disable EoT conditions after 30 seconds (TURN-002) ---

  it('removes EoT condition after 30 seconds if not clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))

    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(goblinConditions).queryByTitle('Weakened (End of turn)')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('keeps EoT condition if clicked within 30 seconds', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))

    const eotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(eotIcon.className).toContain('animate-glow-eot')

    await user.click(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i }))

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()

    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('clicking EoT condition during glow stops the animation', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))

    const eotIcon = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(eotIcon.className).toContain('animate-glow-eot')

    await user.click(within(goblinConditions).getByRole('button', { name: /^Remove Weakened$/i }))

    const eotIconAfter = within(goblinConditions).getByTitle('Weakened (End of turn)')
    expect(eotIconAfter.className).not.toContain('animate-glow-eot')
    vi.useRealTimers()
  })

  it('does not remove neutral conditions after 30 seconds', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    expect(within(goblinConditions).getByTitle('Weakened (neutral)')).toBeInTheDocument()

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(goblinConditions).getByTitle('Weakened (neutral)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('does not remove SE conditions after 30 seconds', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Slowed as save ends on Goblin Assassin 1$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    const seIcon = within(goblinConditions).getByTitle('Slowed (Save ends)')
    expect(seIcon.className).toContain('animate-glow-se')

    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(goblinConditions).getByTitle('Slowed (Save ends)')).toBeInTheDocument()
    expect(seIcon.className).not.toContain('animate-glow-se')
    vi.useRealTimers()
  })

  it('clicking SE condition after 30s post-act window removes it (save failed)', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Slowed as save ends on Goblin Assassin 1$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(goblinConditions).getByTitle('Slowed (Save ends)')).toBeInTheDocument()

    await user.click(within(goblinConditions).getByRole('button', { name: /^Remove Slowed$/i }))

    expect(within(goblinConditions).queryByTitle('Slowed (Save ends)')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('cancels EoT timer when group toggled back to pending before 30 seconds', async () => {
    const user = userEvent.setup()
    render(<App />)
    const goblinConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })

    goblinConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))

    await act(() => { vi.advanceTimersByTime(15_000) })
    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))

    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(goblinConditions).getByTitle('Weakened (End of turn)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('removes multiple EoT conditions from different monsters in the same group', async () => {
    const user = userEvent.setup()
    render(<App />)

    const g1Cond1 = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    g1Cond1.focus()
    await user.keyboard('{Enter}')
    const picker1 = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker1).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    const g1Grid = screen.getByText('Goblin Assassin 1', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const g1Cond2 = within(g1Grid).getByRole('group', {
      name: /^Conditions for Goblin Warrior\./i,
    })
    g1Cond2.focus()
    await user.keyboard('{Enter}')
    const picker2 = screen.getByRole('dialog', { name: /^Add condition to Goblin Warrior$/i })
    await user.click(
      within(picker2).getByRole('button', { name: /^Add Grabbed as end of turn on Goblin Warrior$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(g1Cond1).queryByTitle('Weakened (End of turn)')).not.toBeInTheDocument()
    expect(within(g1Cond2).queryByTitle('Grabbed (End of turn)')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('EoT auto-disable in one group does not affect EoT conditions in another group', async () => {
    const user = userEvent.setup()
    render(<App />)

    const g1Cond = screen.getByRole('group', {
      name: /^Conditions for Goblin Assassin 1\./i,
    })
    g1Cond.focus()
    await user.keyboard('{Enter}')
    const picker1 = screen.getByRole('dialog', { name: /^Add condition to Goblin Assassin 1$/i })
    await user.click(
      within(picker1).getByRole('button', { name: /^Add Weakened as end of turn on Goblin Assassin 1$/i }),
    )

    const sentinelGrid = screen.getByText('Minotaur Sunderer', { exact: true })
      .closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const g4Cond = within(sentinelGrid).getByRole('group', {
      name: /^Conditions for Minotaur Sunderer\./i,
    })
    g4Cond.focus()
    await user.keyboard('{Enter}')
    const picker4 = screen.getByRole('dialog', { name: /^Add condition to Minotaur Sunderer$/i })
    await user.click(
      within(picker4).getByRole('button', { name: /^Add Bleeding as end of turn on Minotaur Sunderer$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(1, 'pending') }))
    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(g1Cond).queryByTitle('Weakened (End of turn)')).not.toBeInTheDocument()
    expect(within(g4Cond).getByTitle('Bleeding (End of turn)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('auto-disables EoT on minion child row after 30 seconds', async () => {
    const user = userEvent.setup()
    render(<App />)

    const minionConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Spinecleaver 2\./i,
    })
    minionConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Spinecleaver 2$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Goblin Spinecleaver 2$/i }),
    )

    expect(within(minionConditions).getByTitle('Bleeding (End of turn)')).toBeInTheDocument()

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(3, 'pending') }))
    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(minionConditions).queryByTitle('Bleeding (End of turn)')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('confirmed minion child EoT survives the 30-second timer', async () => {
    const user = userEvent.setup()
    render(<App />)

    const minionConditions = screen.getByRole('group', {
      name: /^Conditions for Goblin Spinecleaver 2\./i,
    })
    minionConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Goblin Spinecleaver 2$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Bleeding as end of turn on Goblin Spinecleaver 2$/i }),
    )

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: turnButton(3, 'pending') }))

    await user.click(within(minionConditions).getByRole('button', { name: /^Remove Bleeding$/i }))

    await act(() => { vi.advanceTimersByTime(30_000) })

    expect(within(minionConditions).getByTitle('Bleeding (End of turn)')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('renders a reorder drag handle on each encounter group', () => {
    render(<App />)
    const handles = screen.getAllByLabelText(/^Reorder encounter group \d+$/i)
    expect(handles.length).toBeGreaterThanOrEqual(2)
    for (const h of handles) {
      expect(h).toHaveAttribute('draggable', 'true')
    }
  })

  it('reorders encounter groups on drag-and-drop and persists creature order', () => {
    render(<App />)
    const targets = screen.getAllByTestId('encounter-group-drop-target')
    expect(targets.length).toBeGreaterThanOrEqual(2)

    expect(within(targets[0]!).getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()

    const handle1 = screen.getByLabelText(/^Reorder encounter group 1$/i)
    const store = new Map<string, string>()
    const types: string[] = []
    const dt = {
      effectAllowed: 'uninitialized',
      dropEffect: 'none' as const,
      get types() {
        return types as unknown as DOMStringList
      },
      setData(type: string, v: string) {
        store.set(type, v)
        if (!types.includes(type)) types.push(type)
      },
      getData(type: string) {
        return store.get(type) ?? ''
      },
    } as unknown as DataTransfer
    fireEvent.dragStart(handle1, { dataTransfer: dt })
    fireEvent.dragOver(targets[1]!, { dataTransfer: dt })
    fireEvent.drop(targets[1]!, { dataTransfer: dt })

    const after = screen.getAllByTestId('encounter-group-drop-target')
    expect(within(after[1]!).getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()
  })

  it('renders draggable handles on each monster row', () => {
    render(<App />)
    const handles = screen.getAllByLabelText(/Reorder .* within encounter/i)
    expect(handles.length).toBeGreaterThan(0)
    for (const h of handles) {
      expect(h).toHaveAttribute('draggable', 'true')
    }
  })

  it('reorders monsters within a group on drag-and-drop', () => {
    render(<App />)
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const g0 = groups[0]!
    const raiderHandle = within(g0).getByLabelText('Reorder Goblin Warrior within encounter')
    const assassinDrop = g0.querySelector('[data-testid="monster-drop-target"][data-monster-index="0"]')
    expect(assassinDrop).toBeTruthy()
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(raiderHandle, { dataTransfer: dt })
    expect(dt.getData(MONSTER_DRAG_MIME)).toContain('fromMonster')
    fireEvent.dragOver(assassinDrop!, { dataTransfer: dt })
    fireEvent.drop(assassinDrop!, { dataTransfer: dt })
    const rows = g0.querySelectorAll('[data-testid="monster-drop-target"]')
    expect(rows[0]).toHaveTextContent('Goblin Warrior')
    expect(rows[1]).toHaveTextContent('Goblin Assassin 1')
  })

  it('reorders monsters when dropping on the row directly below (swap down)', () => {
    render(<App />)
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const g0 = groups[0]!
    const assassinHandle = within(g0).getByLabelText('Reorder Goblin Assassin 1 within encounter')
    const warriorDrop = g0.querySelector('[data-testid="monster-drop-target"][data-monster-index="1"]')
    expect(warriorDrop).toBeTruthy()
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(assassinHandle, { dataTransfer: dt })
    fireEvent.dragOver(warriorDrop!, { dataTransfer: dt })
    fireEvent.drop(warriorDrop!, { dataTransfer: dt })
    const rows = g0.querySelectorAll('[data-testid="monster-drop-target"]')
    expect(rows[0]).toHaveTextContent('Goblin Warrior')
    expect(rows[1]).toHaveTextContent('Goblin Assassin 1')
  })

  it('reorders minions within horde on drag-and-drop', () => {
    render(<App />)
    const grid = minionGroupGrid()
    const grip1 = within(grid).getByLabelText('Reorder Goblin Spinecleaver 1 within horde')
    const drop2 = grid.querySelector('[data-testid="minion-drop-target"][data-minion-index="1"]')
    expect(drop2).toBeTruthy()
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(grip1, { dataTransfer: dt })
    fireEvent.dragOver(drop2!, { dataTransfer: dt })
    fireEvent.drop(drop2!, { dataTransfer: dt })
    const targets = grid.querySelectorAll('[data-testid="minion-drop-target"]')
    expect(targets[0]).toHaveTextContent('Goblin Spinecleaver 2')
    expect(targets[1]).toHaveTextContent('Goblin Spinecleaver 1')
  })

  it('moves a minion into a horde in another encounter group', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Reorder Goblin Warrior within encounter' }))
    await user.click(screen.getByTestId('grip-menu-convert-squad'))
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const g0 = groups[0]!
    const g2 = groups[2]!
    const spineGrip = within(g2).getByLabelText('Reorder Goblin Spinecleaver 1 within horde')
    const dropEl = g0.querySelector(
      '[data-testid="minion-drop-target"][data-monster-index="1"][data-minion-index="0"]',
    )
    expect(dropEl).toBeTruthy()
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(spineGrip, { dataTransfer: dt })
    fireEvent.dragOver(dropEl!, { dataTransfer: dt })
    fireEvent.drop(dropEl!, { dataTransfer: dt })
    expect(within(g0).getByText('Goblin Spinecleaver 1', { exact: true })).toBeInTheDocument()
    expect(within(g2).queryByText('Goblin Spinecleaver 1', { exact: true })).not.toBeInTheDocument()
  })

  it('moves a monster into another group on drop', () => {
    render(<App />)
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const g0 = groups[0]!
    const g1 = groups[1]!
    const raiderHandle = within(g0).getByLabelText('Reorder Goblin Warrior within encounter')
    const underbossDrop = g1.querySelector('[data-testid="monster-drop-target"][data-monster-index="0"]')
    expect(underbossDrop).toBeTruthy()
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(raiderHandle, { dataTransfer: dt })
    fireEvent.dragOver(underbossDrop!, { dataTransfer: dt })
    fireEvent.drop(underbossDrop!, { dataTransfer: dt })
    expect(within(g1).getByText('Goblin Warrior', { exact: true })).toBeInTheDocument()
    expect(within(g0).queryByText('Goblin Warrior', { exact: true })).not.toBeInTheDocument()
  })

  it('drops a monster into an empty encounter group', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^Add new encounter group$/i }))
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const last = groups[groups.length - 1]!
    const emptyZone = within(last).getByTestId('empty-group-monster-drop-target')
    const raiderHandle = screen.getByLabelText('Reorder Goblin Warrior within encounter')
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(raiderHandle, { dataTransfer: dt })
    fireEvent.dragOver(emptyZone, { dataTransfer: dt })
    fireEvent.drop(emptyZone, { dataTransfer: dt })
    expect(within(last).getByText('Goblin Warrior', { exact: true })).toBeInTheDocument()
  })

  it('transfers an active condition to another monster via drag-and-drop', () => {
    render(<App />)
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const g0 = groups[0]!
    const assassinConditions = within(g0).getByRole('group', { name: /^Conditions for Goblin Assassin 1\./i })
    const weakenedBtn = within(assassinConditions).getByRole('button', { name: /^Remove Weakened$/i })
    const raiderDrop = g0.querySelector('[data-testid="condition-drop-target"][data-monster-index="1"]')
    expect(raiderDrop).toBeTruthy()
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(weakenedBtn, { dataTransfer: dt })
    expect(dt.getData(CONDITION_DRAG_MIME)).toContain('Weakened')
    fireEvent.dragOver(raiderDrop!, { dataTransfer: dt })
    fireEvent.drop(raiderDrop!, { dataTransfer: dt })
    const raiderConditions = within(g0).getByRole('group', { name: /^Conditions for Goblin Warrior\./i })
    expect(within(raiderConditions).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(within(assassinConditions).queryByRole('button', { name: /^Remove Weakened$/i })).toBeNull()
  })

  it('does not remove condition when dropped on the same creature', () => {
    render(<App />)
    const groups = screen.getAllByTestId('encounter-group-drop-target')
    const g0 = groups[0]!
    const assassinConditions = within(g0).getByRole('group', { name: /^Conditions for Goblin Assassin 1\./i })
    const weakenedBtn = within(assassinConditions).getByRole('button', { name: /^Remove Weakened$/i })
    const assassinDrop = g0.querySelector('[data-testid="condition-drop-target"][data-monster-index="0"]')
    const dt = mockMonsterDataTransfer()
    fireEvent.dragStart(weakenedBtn, { dataTransfer: dt })
    fireEvent.dragOver(assassinDrop!, { dataTransfer: dt })
    fireEvent.drop(assassinDrop!, { dataTransfer: dt })
    expect(within(assassinConditions).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
  })
})
