# Browser test plan

What the Playwright tests in `e2e/` cover, and what to add next. See
[`e2e/README.md`](../e2e/README.md) for how they work.

Every test fails on uncaught errors, console errors and error notifications in
any page, so each one is also a smoke test of whatever it touches.

## Covered

- Every actor and item sheet, every tab, in the world and owned; every
  built-in preset's new PC and NPC sheets; every settings page.
- Abilities: tests and spends from sheets, Full Refresh, Dying Earth tests
  (difficulty, boon/levy, re-rolls).
- Attacks: damage application and undo (GM, and a player via the GM); NPC
  bonuses; bursts, full-auto, Lethality, jams, walking fire, critical hits,
  Shot Dry; two people editing one card at once.
- Combat: classic (create, sort, start, turns, rounds); turn-passing (taking
  turns, new rounds, players acting only for their own combatants).
- Settings: changing and saving, equipment categories and fields, import and
  export.
- Typing into fields that save as you type; personal details; the party
  sheet; cards; the journal HTML editor; quick Health changes; PC tokens
  being linked.
- What players can and can't do: what they see on attack cards (Health only
  with Observer permission), not changing others' cards, the GM-only settings
  menu and NPC GM notes, read-only sheets at Observer (every control on PC,
  NPC and item sheets, poked), and the cut-down sheets at Limited.

## To do

Roughly in order of value.

### Token bars and wound states

- Editing Health below 0 from the token bar (`modifyTokenAttribute`), and
  quick edits.
- Wound status effects on tokens (`useWoundStatusEffects`).

### Drag and drop

- Equipment and abilities dropped onto actor sheets, from the sidebar and
  from compendiums.
- A folder of actors dropped onto a party sheet.
- Drag-sorting lists in the settings.

### Reloading

- Make changes, reload the page, and check they're all still there (e.g. a
  journal page's revision history).

### Ability and item details

- Specialities, situational modifiers, unlocks and boost.
- Pushing pools, and the push card.
- Quick Shock investigative abilities; general abilities which can be spent
  investigatively.
- Weapon range bands, reloading and ammo; equipment config.

### Settings with knock-on effects

- PC and NPC stats: added or renamed stats show on sheets, and get used
  (e.g. Hit Threshold in attacks).
- Personal detail slots; card categories.
- Which compendiums new characters get their abilities from.
- Closing the settings with unsaved changes.
- Custom themes, and each sheet's theme picker.

### Broad checks

- Accessibility scans (`@axe-core/playwright`) during the sheet and settings
  tours.
- Screenshot comparisons of each sheet in each theme, for layout and CSS
  regressions.
- A smoke run in another language (e.g. German, Japanese), for missing
  translations and layouts that break with longer text.

### Integrations

- Dice So Nice (`showRolls`) and PopOut! (the `PopOut:*` hooks).

## Not planned

- Migrations: there's no old world data to test them against.
- Foundry v13: not supported.
