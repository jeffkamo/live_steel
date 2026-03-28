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
    expect(within(tracker).getByText('Weakened')).toBeInTheDocument()
    expect(within(tracker).getByText('Slowed')).toBeInTheDocument()
    expect(screen.getByText('Ironwood Sentinel', { exact: true })).toBeInTheDocument()
    expect(within(tracker).getByText('Bleeding')).toBeInTheDocument()
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
    expect(scope.getByText('2')).toBeInTheDocument()
  })

  it('shows placeholder stamina and MARIP characteristics for reserve slot', () => {
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    expect(scope.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows “No active conditions” when a creature has none', () => {
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    expect(within(groupGrid as HTMLElement).getByText('No active conditions')).toBeInTheDocument()
  })

  it('removes a creature condition when its pill remove control is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Assassin 1', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    expect(scope.getByText('Weakened', { exact: true })).toBeInTheDocument()
    expect(scope.getByText('Slowed', { exact: true })).toBeInTheDocument()

    await user.click(scope.getByRole('button', { name: /^Remove Weakened$/i }))

    expect(scope.queryByText('Weakened', { exact: true })).not.toBeInTheDocument()
    expect(scope.getByText('Slowed', { exact: true })).toBeInTheDocument()
  })

  it('cycles creature condition duration neutral → EoT → SE when the label is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Goblin Assassin 1', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)

    await user.click(
      scope.getByRole('button', { name: /^Slowed, neutral\. Cycle duration$/i }),
    )
    expect(
      scope.getByRole('button', { name: /^Slowed, end of turn\. Cycle duration$/i }),
    ).toBeInTheDocument()
    expect(scope.getByText(/EoT/)).toBeInTheDocument()

    await user.click(
      scope.getByRole('button', { name: /^Slowed, end of turn\. Cycle duration$/i }),
    )
    expect(
      scope.getByRole('button', { name: /^Slowed, save ends\. Cycle duration$/i }),
    ).toBeInTheDocument()
    expect(scope.getByText(/SE/)).toBeInTheDocument()

    await user.click(
      scope.getByRole('button', { name: /^Slowed, save ends\. Cycle duration$/i }),
    )
    expect(
      scope.getByRole('button', { name: /^Slowed, neutral\. Cycle duration$/i }),
    ).toBeInTheDocument()
    const slowedCycle = scope.getByRole('button', { name: /^Slowed, neutral\. Cycle duration$/i })
    expect(within(slowedCycle).queryByText(/EoT/)).not.toBeInTheDocument()
  })

  it('renders terrain objects, notes, stamina, and condition pills', () => {
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
    expect(within(terrain).getByText('Slowed')).toBeInTheDocument()
    expect(within(terrain).getByText('Weakened')).toBeInTheDocument()
    expect(
      within(terrain).getByText('Ritual circle (inactive). Chalk smeared, runes still warm.', {
        exact: true,
      }),
    ).toBeInTheDocument()
    expect(within(terrain).getByText('Marked')).toBeInTheDocument()
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

  it('opens add-condition dialog from empty cell and adds neutral condition from name', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    const reserveConditions = scope.getByRole('group', { name: /^Conditions for Reserve slot/i })

    expect(within(reserveConditions).getByText('No active conditions')).toBeInTheDocument()
    await user.click(reserveConditions)

    const picker = await screen.findByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    // Frightened — avoids clashing with Dazed on Ironwood Sentinel in the same encounter group.
    await user.click(within(picker).getByRole('button', { name: /^Frightened$/i }))

    expect(within(reserveConditions).queryByText('No active conditions')).not.toBeInTheDocument()
    expect(
      within(reserveConditions).getByRole('button', {
        name: /^Frightened, neutral\. Cycle duration$/i,
      }),
    ).toBeInTheDocument()
  })

  it('adds EoT and SE from picker duration controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)

    await user.click(scope.getByRole('group', { name: /^Conditions for Reserve slot/i }))
    let picker = screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    await user.click(
      within(picker).getByRole('button', { name: /^Add Marked as end of turn on Reserve slot$/i }),
    )

    expect(
      scope.getByRole('button', { name: /^Marked, end of turn\. Cycle duration$/i }),
    ).toBeInTheDocument()

    await user.click(scope.getByRole('group', { name: /^Conditions for Reserve slot/i }))
    picker = screen.getByRole('dialog', { name: /^Add condition to Reserve slot$/i })
    const markedEot = within(picker).getByRole('button', {
      name: /^Add Marked as end of turn on Reserve slot$/i,
    })
    expect(markedEot.className).toMatch(/amber/)

    await user.click(
      within(picker).getByRole('button', { name: /^Add Prone as save ends on Reserve slot$/i }),
    )
    expect(
      scope.getByRole('button', { name: /^Prone, save ends\. Cycle duration$/i }),
    ).toBeInTheDocument()
  })
})
