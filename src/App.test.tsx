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
    expect(screen.getByRole('heading', { level: 1, name: /^Steel Roster$/i })).toBeInTheDocument()
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

    reserveConditions.focus()
    await user.keyboard('{Enter}')
    picker = screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    const markedEot = within(picker).getByRole('button', {
      name: /^Add Marked as end of turn on Reserve slot$/i,
    })
    expect(markedEot.className).toMatch(/amber/)

    await user.click(
      within(picker).getByRole('button', { name: /^Add Prone as save ends on Reserve slot$/i }),
    )
    expect(scope.getByTitle('Prone (Save ends)')).toBeInTheDocument()
  })
})
