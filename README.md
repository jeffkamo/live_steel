# Steel Roster

**Steel Roster** is a **digital encounter roster** for running combat at the table. It is meant for whoever is running the scene (typically the GM): one screen shows the enemies and environmental pieces that matter in play, so you are not flipping paper stat blocks mid-fight.

An inspiration for the app is [Forge Steel](https://forgesteel.net). Steel Roster is not affiliated with or endorsed by that project; the link is simply a nod to what sparked the idea.

## What it does

- **Creature tracker** — Lists each encounter group and its creatures with the stats you need during combat: stamina, the **MARIP** line, **free strike / distance / stability**, and **conditions**. Names and roles (horde, solo, elite, etc.) stay visible so you remember who is on the field.
- **Turn markers** — Each group has a **Turn** control so you can mark whether that side has acted this round. **Reset** clears every group back to “pending” when a new round starts (or when you want a clean slate).
- **Dynamic terrain** — Separate rows for **objects and zones** on the map: what they are, any **stamina** or durability you track, notes for how they behave, and tags such as hazards or difficult ground.

The app does not roll dice or enforce rules; it is a **readable control panel** for the encounter you have prepared. Data in the UI is sample content until you wire in your own encounters.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
npm run test:run # unit tests (Vitest + Testing Library)
```

## License

> Steel Roster is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2024 MCDM Productions, LLC.
