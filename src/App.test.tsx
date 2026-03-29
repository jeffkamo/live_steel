import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

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
    expect(screen.getByText('Level 1 Horde · Ambusher')).toBeInTheDocument()
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
    expect(within(tracker).getByRole('button', { name: /^Remove Weakened$/i })).toBeInTheDocument()
    expect(within(tracker).getByRole('button', { name: /^Remove Slowed$/i })).toBeInTheDocument()
    expect(screen.getByText('Ironwood Sentinel', { exact: true })).toBeInTheDocument()
    expect(within(tracker).getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
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

  it('shows placeholder stamina and MARIP characteristics for reserve slot', () => {
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    expect(scope.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows all condition icons dimmed when a creature has none active', () => {
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })
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
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    expect(within(reserveConditions).getByRole('button', { name: /^Add Frightened$/i })).toBeInTheDocument()
    reserveConditions.focus()
    await user.keyboard('{Enter}')

    const picker = await screen.findByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    // Frightened — avoids clashing with Dazed on Ironwood Sentinel in the same encounter group.
    await user.click(within(picker).getByRole('button', { name: /^Frightened$/i }))

    expect(within(reserveConditions).getByRole('button', { name: /^Remove Frightened$/i })).toBeInTheDocument()
    expect(within(reserveConditions).getByTitle('Frightened (neutral)')).toBeInTheDocument()
  })

  it('adds EoT and SE from picker duration controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    let picker = screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Marked as end of turn on Reserve slot$/i }),
    )

    expect(scope.getByTitle('Marked (End of turn)')).toBeInTheDocument()

    const markedEot = within(picker).getByRole('button', {
      name: /^Add Marked as end of turn on Reserve slot$/i,
    })
    expect(markedEot.className).toMatch(/amber/)

    await user.click(
      within(picker).getByRole('button', { name: /^Add Prone as save ends on Reserve slot$/i }),
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
    expect(screen.getByText('15 / 15')).toBeInTheDocument()
  })

  it('caps stamina at max even with +1 when already at max', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Underboss$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }))
    expect(screen.getByText('22 / 22')).toBeInTheDocument()
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

  it('shows dash for zero/zero stamina (reserve slot)', () => {
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Reserve slot$/i })
    expect(within(staminaGroup).getByText('—')).toBeInTheDocument()
    expect(within(staminaGroup).queryByRole('img', { name: /Healthy|Winded|Dead/i })).toBeNull()
  })

  it('positive delta on 0/0 stamina creates new max equal to delta', async () => {
    const user = userEvent.setup()
    render(<App />)
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Reserve slot$/i })
    await user.hover(staminaGroup)
    await user.click(within(staminaGroup).getByRole('button', { name: /^Increase stamina by 10$/i }))
    expect(screen.getByText('10 / 10')).toBeInTheDocument()
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
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: /^Add condition to Reserve slot$/i })).toBeNull()
  })

  // --- Condition picker: re-opening and selecting a second condition ---

  it('adds a condition via picker name button (neutral), then adds a second via another open', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    await user.click(within(picker).getByRole('button', { name: /^Bleeding$/i }))
    expect(within(reserveConditions).getByTitle('Bleeding (neutral)')).toBeInTheDocument()

    await user.click(within(picker).getByRole('button', { name: /^Surprised$/i }))
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
    const sentinelGrid = screen.getByText('Ironwood Sentinel', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const sentinelScope = within(sentinelGrid)
    const sentinelConditions = sentinelScope.getByRole('group', { name: /^Conditions for Ironwood Sentinel\./i })
    const echoConditions = sentinelScope.getByRole('group', { name: /^Conditions for Arcane Echo\./i })

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
      'Goblin Assassin 1', 'Goblin Raider', 'Goblin Underboss',
      'Minions', 'Ironwood Sentinel', 'Arcane Echo', 'Reserve slot',
    ]
    for (const name of expectedNames) {
      expect(screen.getByText(name, { exact: true })).toBeInTheDocument()
    }
  })

  it('renders creature subtitles', () => {
    render(<App />)
    expect(screen.getByText('Level 1 Horde · Ambusher')).toBeInTheDocument()
    expect(screen.getByText('Level 2 Solo · Commander')).toBeInTheDocument()
    expect(screen.getByText('Level 3 Elite · Bruiser')).toBeInTheDocument()
    expect(screen.getByText('Level 2 Horde · Caster')).toBeInTheDocument()
    expect(screen.getByText('Drop-in threat or hazard')).toBeInTheDocument()
  })

  it('renders FS/Dist/Stab stat headers', () => {
    render(<App />)
    expect(screen.getAllByTitle('Free strike').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTitle('Distance').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTitle('Stability').length).toBeGreaterThanOrEqual(1)
  })

  // --- MARIP characteristics for multiple creatures ---

  it('renders MARIP values for Ironwood Sentinel (2, -1, 0, 1, 2)', () => {
    render(<App />)
    const nameEl = screen.getByText('Ironwood Sentinel', { exact: true })
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
    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Raider$/i })
    expect(within(staminaGroup).getAllByRole('img', { name: /Healthy/i }).length).toBeGreaterThanOrEqual(1)

    await user.hover(staminaGroup)
    const minus1 = within(staminaGroup).getByRole('button', { name: /^Decrease stamina by 1$/i })
    await user.click(minus1)
    await user.click(minus1)
    expect(screen.getByText('6 / 12')).toBeInTheDocument()
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
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    const picker = screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    await user.click(within(picker).getByRole('button', { name: /^Add Dazed as end of turn on Reserve slot$/i }))
    expect(within(reserveConditions).getByTitle('Dazed (End of turn)')).toBeInTheDocument()

    await user.click(within(picker).getByRole('button', { name: /^Add Dazed as save ends on Reserve slot$/i }))
    expect(within(reserveConditions).getByTitle('Dazed (Save ends)')).toBeInTheDocument()
  })

  // --- Accessibility: aria-expanded on condition cell ---

  it('sets aria-expanded on the condition cell when picker opens and closes', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

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
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(groupGrid)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    reserveConditions.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })).toBeInTheDocument()
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

  // --- Goblin Raider initial stamina ---

  it('shows correct initial stamina for Goblin Raider', () => {
    render(<App />)
    expect(screen.getByText('8 / 12')).toBeInTheDocument()
  })

  // --- Arcane Echo initial conditions ---

  it('shows Restrained condition active on Arcane Echo', () => {
    render(<App />)
    const sentinelGrid = screen.getByText('Arcane Echo', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const echoConditions = within(sentinelGrid).getByRole('group', { name: /^Conditions for Arcane Echo\./i })
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

  // --- Ironwood Sentinel has both Bleeding and Dazed ---

  it('Ironwood Sentinel has both Bleeding and Dazed conditions active', () => {
    render(<App />)
    const grid = screen.getByText('Ironwood Sentinel', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const conditions = within(grid).getByRole('group', { name: /^Conditions for Ironwood Sentinel\./i })
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

  // --- Group ordinal badges show correct numbers per group ---

  it('group 4 shows ordinal badges 1, 2, 3 for its three creatures', () => {
    render(<App />)
    const grid = screen.getByText('Ironwood Sentinel', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const scope = within(grid)
    expect(scope.getByRole('button', { name: /creature 1 of 3/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /creature 2 of 3/i })).toBeInTheDocument()
    expect(scope.getByRole('button', { name: /creature 3 of 3/i })).toBeInTheDocument()
  })

  // --- Minion dead/alive toggle (MINION-003) ---

  const expandMinions = async (user: ReturnType<typeof userEvent.setup>) => {
    const grid = screen.getByText('Minions', { exact: true }).closest('div.grid.items-stretch.rounded-lg') as HTMLElement
    const expandBtn = within(grid).getByRole('button', { name: /^Expand individual Minions$/i })
    await user.click(expandBtn)
    return grid
  }

  it('minion child rows default to alive state', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = await expandMinions(user)
    const scope = within(grid)
    const toggles = scope.getAllByRole('checkbox', { name: /alive$/i })
    expect(toggles).toHaveLength(4)
    for (const toggle of toggles) {
      expect(toggle).not.toBeChecked()
    }
    expect(scope.getAllByText('Alive')).toHaveLength(4)
  })

  it('clicking the dead/alive toggle marks a minion as dead', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = await expandMinions(user)
    const scope = within(grid)
    const toggle = scope.getByRole('checkbox', { name: /Goblin Spinecleaver 1.*alive$/i })
    await user.click(toggle)
    expect(toggle).toBeChecked()
    expect(scope.getByRole('checkbox', { name: /Goblin Spinecleaver 1.*dead$/i })).toBeInTheDocument()
  })

  it('toggling a minion dead applies visual dimming and strikethrough', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = await expandMinions(user)
    const scope = within(grid)
    const toggle = scope.getByRole('checkbox', { name: /Goblin Spinecleaver 2.*alive$/i })
    await user.click(toggle)
    const nameEl = scope.getByText('Goblin Spinecleaver 2', { exact: true })
    expect(nameEl.className).toMatch(/line-through/)
  })

  it('toggling a dead minion back to alive removes visual state', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = await expandMinions(user)
    const scope = within(grid)
    const toggle = scope.getByRole('checkbox', { name: /Goblin Spinecleaver 1.*alive$/i })
    await user.click(toggle)
    expect(toggle).toBeChecked()
    await user.click(toggle)
    expect(toggle).not.toBeChecked()
    const nameEl = scope.getByText('Goblin Spinecleaver 1', { exact: true })
    expect(nameEl.className).not.toMatch(/line-through/)
  })

  it('dead/alive toggle label text switches between Dead and Alive', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = await expandMinions(user)
    const scope = within(grid)
    expect(scope.getAllByText('Alive')).toHaveLength(4)
    expect(scope.queryByText('Dead')).toBeNull()
    const toggle = scope.getByRole('checkbox', { name: /Goblin Spinecleaver 3.*alive$/i })
    await user.click(toggle)
    expect(scope.getAllByText('Alive')).toHaveLength(3)
    expect(scope.getByText('Dead')).toBeInTheDocument()
  })

  it('dead minion toggle does not affect other minions in the group', async () => {
    const user = userEvent.setup()
    render(<App />)
    const grid = await expandMinions(user)
    const scope = within(grid)
    await user.click(scope.getByRole('checkbox', { name: /Goblin Spinecleaver 1.*alive$/i }))
    const otherToggles = [
      scope.getByRole('checkbox', { name: /Goblin Spinecleaver 2/i }),
      scope.getByRole('checkbox', { name: /Goblin Spinecleaver 3/i }),
      scope.getByRole('checkbox', { name: /Goblin Spinecleaver 4/i }),
    ]
    for (const t of otherToggles) {
      expect(t).not.toBeChecked()
    }
  })

  it('minion child rows render toggle in stamina column (col 3)', async () => {
    const user = userEvent.setup()
    render(<App />)
    await expandMinions(user)
    const toggles = screen.getAllByRole('checkbox', { name: /alive$/i })
    expect(toggles.length).toBeGreaterThanOrEqual(4)
  })
})
