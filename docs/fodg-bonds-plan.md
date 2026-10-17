# Fall of DELTA GREEN Bonds: implementation plan

Goal: give Bonds real mechanics instead of a free-text note. FoDG-shaped,
behind a setting. Page references are to the *Fall of DELTA GREEN* corebook.
See also [`fodg-preset.md`](fodg-preset.md).

## Rules as we read them

- A Bond is a named person or small group (p. 045). Each has a number of
  **Bond points**. The book calls this a "rating", a "strength" and "points",
  but there is only one number: no separate pool and rating, no refresh rules,
  and the paper sheet (p. 348) has one column for it.
- Bond points **never refresh**. They change by being spent, by damage, and by
  rebuilding.
- **Maximum** 4 (p. 045). At **−1** a Bond is **broken** (p. 046).
- **Starting value** (p. 045): one more than the highest of Flattery,
  Inspiration, Negotiation and Reassurance (or 1 if none). Agents start with 3
  Bonds.
- **Spending on Stability tests** (p. 120): Bond points can be spent on any
  Stability test as though they were Stability points, so they add to the
  roll, and can be combined with Stability points. Spending can take a Bond
  down to −1, breaking it: a desperate measure, but available.
- **Burning after a loss** (p. 120): immediately after losing Stability, spend
  2 Bond points per Stability point restored. This can undo becoming Shaken or
  Shattered.
- Each use damages the relationship (p. 120): the player notes the damage and
  plays it out next time the Agent sees that person.
- **Rebuilding** (p. 128), between operations, non-DELTA GREEN Bonds only:
  - Stability test at Difficulty 4. Points from Interpersonal abilities can be
    spent on it (they don't refresh before the next mission).
  - Success: Bond +1, refresh d−2 Stability (minimum 1).
  - Successful 6 (succeeds *and* the die shows 6, p. 080): Bond +2, refresh
    d+0 Stability.
  - Failure: nothing; failed 1 (fails *and* the die shows 1): Bond −1.
- **DELTA GREEN Bonds** (p. 046) form with teammates after a team crisis
  (failed Difficulty 4 Stability test): new ones start at half your highest
  Bond (round up); existing ones go up by 1; each costs 1 point from a
  non-DELTA GREEN Bond. They can't be rebuilt the normal way.
- **Adapted to Violence** (p. 120) caps the four interpersonal abilities at 1,
  and so Bonds at 2. We don't track adaptation yet.

## Design

### Data

A new `bond` Item type, for PCs only:

- name: who the Bond is with
- `points`: number, −1 to 4
- `isDeltaGreen`: boolean
- `notes`: HTML, for recording damage

Broken is derived (`points <= -1`), not stored.

### Settings

All exportable, part of the preset format (optional on `PresetV1`, defaults in
`pathOfCthulhuPreset`), off by default, on in `fallOfDeltaGreenPreset`:

| Setting                    | Default                                        | Use                                                        |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `useBonds`                 | `false`                                        | Turns the feature on                                       |
| `bondStabilityAbility`     | `"Stability"`                                  | Tests that can take Bond points; what burning restores     |
| `bondRatingAbilities`      | Flattery, Inspiration, Negotiation, Reassurance | Starting value hint                                        |
| `bondRebuildSpendCategory` | `"Interpersonal"`                              | Abilities in this category can be spent when rebuilding    |

The numbers (maximum 4, broken at −1, rebuild Difficulty 4, burn rate 2:1)
are constants: FoDG-shaped, not configurable.

### Sheet

A **Bonds** tab on the PC sheet, shown when `useBonds` is on (like Cards).
Each row: name, points stepper, a "DELTA GREEN" badge, a "Broken" badge (not
crossed out, for legibility), notes, and actions. An add button creates a
Bond.

### Rules code

Pure functions (no Foundry), unit tested: clamping points, broken state,
burn cost, rebuild outcome from a roll and total, starting value hint. Foundry
glue lives elsewhere.

## Phases

### Phase 1: Bonds on the sheet (done)

- `bond` Item type (`src/module/items/bond.ts`), rules in
  `src/module/bonds/rules.ts`.
- `useBonds` setting, with its own top-level settings page. The other three
  settings arrive with the phases that use them.
- Bonds tab (`src/components/bonds/`): add, points stepper, badges; name,
  DELTA GREEN toggle, notes and delete on the Bond's sheet.
- On in the FoDG preset, which no longer has a "Bonds" long note.
- Browser tests in `e2e/bonds.spec.ts`.
- The icon is a placeholder (`dark-squad.webp`, also used for parties).

### Phase 2: spending Bonds (done)

- `bondStabilityAbility` setting (default Stability).
- The test panel on that ability's sheet has a row of spend buttons for each
  Bond, like the weapon sheet's extra spends (compact `CheckButtons`, and the
  main row labelled with the ability's name; Bond names open their sheets).
  Rows are labelled with just the Bond's name: the enabled buttons show its
  points. Each Bond can spend down to broken, after a confirmation naming
  the Bonds it would break. Broken Bonds are still listed, so nobody goes
  looking for them, but with a broken heart and every button disabled. (All
  ability sheets now use the compact spend buttons.)
- `testAbility` takes the Bond spends, re-checks them, adds their total as one
  term, and records them on the card (`data-bond-spends`, see
  `bondSpends.ts`) by name, so the card survives a Bond being renamed or
  deleted. The card shows "Bonds: Mom 2".
- **Burn** button (`BurnBondButton`) on each Bond row and on the Bond's
  sheet: 2 Bond points (down to broken) for 1 Stability point, up to its
  rating. A confirmation spells out the trade (points before and after, and
  a warning if it breaks the Bond), and a chat message records it. We don't
  track whether Stability was "just lost"; the player decides when it
  applies.
- The compact test buttons on the Abilities tab don't offer Bonds: open the
  Stability sheet to spend them.

### Phase 3: rebuilding (done)

- `bondRebuildSpendCategory` setting (default Interpersonal).
- A **Rebuild Bond →** button on the Bond's sheet, for ordinary Bonds that
  aren't broken, opens a nested panel (`RebuildBondPanel`, routed with
  minirouter like the Card sheet): spend rows for Stability and for each
  ability in the category with a rating (names open their sheets; an empty
  pool is listed, but its buttons are disabled), then a Stability test at
  Difficulty 4. It slides back out once rolled. (It was inline at first, but
  with five or more abilities in the category it squashed the notes away.)
- Rules in `src/module/bonds/rebuild.ts` (outcome, Bond change, refresh,
  Stability after), glue in `rebuildBond.ts`, which re-checks the spends,
  rolls the test and (on a success) the refresh die, and applies everything
  in one update:
  - successful 6 (the die shows 6): Bond +2, refresh d+0;
  - success: Bond +1, refresh d−2 (minimum 1);
  - failure: nothing; failed 1 (the die shows 1): Bond −1.
  - Bonds cap at 4. Stability's spend comes off first, and the refresh never
    takes it above the rating.
- One chat card (`RebuildBondCard`, mode `bond-rebuild`) shows the test,
  spends, outcome and changes. It's settled when rolled, so the card carries
  the whole record (`data-bond-rebuild`) and doesn't need the actor.
- `SpendButtons` is the shared compact 0–7 spend row, used here and on ability
  sheets.
- The other Personal Life vignettes (p. 129) share the successful 6 / failed
  1 shape; `getRebuildOutcome` would serve a general vignette roller.

### Phase 4: helpers (later, if wanted)

- Starting value hint from `bondRatingAbilities`.
- Automating DELTA GREEN Bonds (p. 046): decide after regular Bonds land.
- Adapted to Violence cap: needs adaptation tracking first.
