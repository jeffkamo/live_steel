# Todos

Ideas and enhancements tracked for future work (not committed to a roadmap).

# Stat blocks

- [x] Render Stat blocks (the monster's list of attacks, etc) on a per monster and minion basis, can be expanded or collapsed.
- [x] Rendered in the style remoniscent of stat blocks from Draw Steel book (using the icons/glyphs from here: /home/kamo/Downloads/DrawSteelGlyphs, and the visual language of the stat blocks as seen in this screenshot @/home/kamo/Pictures/screenshot-2026-03-28_16-45-51.png)
- [x] The data for these stat blocks will come from https://github.com/SteelCompendium/data-bestiary-md and/or https://github.com/SteelCompendium/data-bestiary-json
- [ ] Parsing the data will use this tool: https://www.npmjs.com/package/steel-compendium-sdk — bundled `statblocks.json` is loaded directly in the app; the SDK is a dependency but not invoked in application code today.
- [x] Render the monster's HP (at least the default max stamina and the default current stamina), MARIP, and other stats based on the monster's json data

# Minions

- [x] Minions need the ability to be assigned a captain by picking one of the other monsters from among the groups in the encounter
- [x] Assigning a captain will work by clicking a "Captain" pill under the "Minion" header in the parent minion row, which reveals a dropdown
- [x] The captain dropdown will be a list of all other monsters in the encounter. Clicking one of the options will assign that monster as the minion group's captain, causing the captain pill to render the captain's monster number (in that monster's colored ordinal number) and their monster name
- [x] A captain can be removed by clicking the captain pill again by click an "x" button next to the captain monster's name.
- [x] Because of Minion's shared stamina pool, there needs to be a way to mark which child minion monsters are dead or not.
- [x] Minion Stamina needs a different way of rendering stamina that looks more like "5 / 10 / 15 / 20" etc. - the idea being that it's clear to the Director at which intervals individual minions die (because they have a shared stamina pool). The size of each interval should be based on the stats of that minion (see the Stat Blocks section's data source) 
- [x] This minion specific stamina input should still have a popover that appears on hover, with the same ability to add or remove stamina like any other monster. However, instead of the text input being a "currentStam / maxStam" it'll be a "lastInvterval / interval / interval / firstInterval" layout - the number of intervals depends on how many minions there are, and the size of the interval depends on the stats of the minion.
- [x] Because of the shared stamina pool, as the stamina drops from interval to interval, there needs to be a way for the UI needs to subtly inform the director that minions need to be killed (or revived). At that point, it's up to the director to manually mark the child minions as dead or alive.
- [x] Maybe child minions, instead of having a stamina counter like the parent minion and other monsters, have a checkbox to mark if they're dead or not — implemented as a life toggle on each child row (not a literal checkbox).

# Malice

- [x] I'm not sure yet how I want to deal with malice, so for now don't render their stat blocks — **done:** malice-cost features and effects are filtered out in the bestiary layer; stat blocks still show core stats and remaining (non-malice) abilities.

# Data

- [x] Add the ability to add monsters to an existing group
- [x] Add the ability to create a new blank group
- [x] Add the ability to delete a monster from a group
- [x] When adding monsters, the list of monsters come from the JSON data

## UI polish

- [x] Improve vertical spacing rhythm between site header, roster controls (New turn / Lock), and encounter table.

## Drag and drop

- [x] **Reorder encounter groups** — Change the order of groups on the roster (e.g. initiative or table preference).
- [x] **Reorder monsters within a group or move between groups** — Reposition creatures inside their current group, or drag them into another group without re-entering data.
- [x] **Move conditions between monsters** — Drag a condition pill from one creature to another (e.g. transfer Judged from one target to another) instead of removing and re-adding.

## Advanced turn features

- [x] When setting a monster's turn to "acted", animate the "EoT" and "SE" to pulsate or glow to indicate that they will change soon
- [x] If not clicked within 30 seconds, the EoT conditions become disabled (because they deactivate at end of turn). Clicking the EoT condition effectively tells the condition to STAY (ex. maybe the turn button was clicked by accident, and we don't want to get rid of the condition due to the misclick)
- [x] If not clicked within 30 seconds, the SE condition remains enabled (because we assume by default that the monster saved, causing the condition to remain). Thus, clicking the condition is the only way to get rid of it.
- [x] When unsetting or putting groups' turn states back to pending, no changes should be made to conditions (they remain as they currently are)
- [x] If one sets a group to "acted" (causing the conditions to glow/pulsate) and then immediately put the same group back to "pending", then the condition animations cancel, and remain unchanged (the conditions remain active).

## Accessibility

- [ ] **Keyboard-only pass** — Walk the app with keyboard only; ensure focus states are visible and that activating controls with Enter/Space matches pointer behavior.
- [ ] **Dropdown keyboard access** — After opening a dropdown, options remain reachable and activatable from the keyboard (focus trap/restore, arrow keys, Escape, etc. as appropriate).

---

# Advanced

- [ ] Add history menu that shows you each action performed. Things like applying damage or healing stamina should be batched (that way you don' tend up with 50 or 100 +10 or -10 actions)
- [x] Persist encounter data in local storage
- [x] Reload local storage state on page load
- [x] Add the ability to create new, empty encounters and name them
- [x] Add the ability to switch between encounters

---

# Ideas from my first session with the game

- [ ] Add way to add malice features, both exist and custom
- [ ] Add way to collapse squads to hide children minions. They should be default open. Maybe auto collapse when all are dead
- [ ] Add ability to define custom abilities to monsters
- [ ] Add ability to save monsters (can be saved, added from monster dropdown, and exported/imported)
- [ ] There needs to be a faster way to enter monster data (import tool?)
- [ ] Add missing "Villain actions" to monster statblocks

---

# Mobile support

- [ ] Make design responsive
- [ ] Make sure all interactive elements work with touch (ex. reveal things on hover)
- [ ] Add ability to create sharable links (encodes local storage data in a URL param?)
- [ ] Create an export/import data feature

