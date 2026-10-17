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
  Bonds. This only matters at character creation, so we don't help with it.
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
- **Establishing a new Bond** (p. 129), between operations, is how Bonds are
  made in play, and the only way back from a broken one (p. 046: "rebuild it
  from scratch"):
  - Spend 1 Interpersonal point (it doesn't refresh before the next mission),
    and reduce one non-DELTA GREEN Bond by 1, whatever the roll.
  - Roll a die (not a test: nothing can be spent on it). 1: rejected, lose 1
    Stability pool point. 2–5: the new Bond's rating is the die − 2 (so it
    can start at 0). 6: rating 3, and the Interpersonal point is refunded.
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
| `bondRebuildSpendCategory` | `"Interpersonal"`                              | Abilities in this category can be spent when rebuilding, and on establishing a new Bond |

The numbers (maximum 4, broken at −1, rebuild Difficulty 4, burn rate 2:1)
are constants: FoDG-shaped, not configurable.

### Sheet

A **Bonds** tab on the PC sheet, shown when `useBonds` is on (like Cards).
A table: name, badges ("DELTA GREEN", and "Broken" rather than crossing it
out, for legibility; no header), and the rating as plain text, under an
underlined header row like the ability categories'. The name takes at least
a third of the width, and a long one up to half, then it's cut off with an
ellipsis (the full name is its tooltip). The badges and the (right-aligned)
rating take what they need, and an empty last column takes the slack, so the
rating doesn't end up stranded out on the right. Badges never wrap, so their
column is always wide enough for both; in a narrow sheet the name gives way
first. The whole row opens the Bond's sheet, which has the editing and the
actions: changing the rating by hand and burning should both be rare. An add
button creates a Bond.

### Rules code

Pure functions (no Foundry), unit tested: clamping points, broken state,
burn cost, rebuild outcome from a roll and total, establishing a new Bond.
Foundry glue lives elsewhere.

## Phases

### Phase 1: Bonds on the sheet (done)

- `bond` Item type (`src/module/items/bond.ts`), rules in
  `src/module/bonds/rules.ts`.
- `useBonds` setting, with its own top-level settings page. The other three
  settings arrive with the phases that use them.
- Bonds tab (`src/components/bonds/`): add, points stepper, badges; name,
  DELTA GREEN toggle, notes and delete on the Bond's sheet. (Later the tab
  became a plain table, with the stepper and Burn only on the sheet.)
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
- **Burn** button (`BurnBondButton`) on the Bond's sheet (at first on each
  row of the Bonds tab too): 2 Bond points (down to broken) for 1 Stability point, up to its
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

### Phase 4: establishing new Bonds (done)

- The Bonds tab has a router, like the Cards tab, and an **Establish Bond →**
  button opens a nested panel (`EstablishBondPanel`). It's next to **Add
  Bond**, which stays for character creation (no roll); tooltips on both
  spell out the difference.
  - **Who**: someone new (a name), or one of the broken ordinary Bonds, which
    is re-formed in place, so its notes carry over. Only shown when there are
    broken Bonds.
  - **Spend**: an ability in `bondRebuildSpendCategory` (abilities with a
    rating are listed; empty ones are disabled). With no points anywhere, the
    button is disabled and a hint below it says so, styled like the weapon
    sheet's (`Hint`, which they now share).
  - **Neglect**: an ordinary Bond that isn't broken. If there isn't one, the
    panel says so and the neglect is skipped. If the neglect would break it,
    a confirmation asks first.
- Rules in `src/module/bonds/establish.ts`, glue in `establishBond.ts`, which
  re-checks the choices, rolls, and applies everything (the point, the
  neglect, Stability on a rejection, and the new or re-formed Bond).
- One chat card (`EstablishBondCard`, mode `bond-establish`), settled when
  rolled like the rebuild card (`data-bond-establish`).
- `forceDice` in the browser tests now takes any d6 face.
- The starting value hint was dropped: it only applies at character creation,
  where the player can just type the number.

### Later, if wanted

- Automating DELTA GREEN Bonds (p. 046): a team-wide flow, so a bigger job.
- Adapted to Violence cap: needs adaptation tracking first.
- The other Personal Life vignettes (p. 129, e.g. One With Nature, Head
  Games) share the shape, but are about Stability rather than Bonds.
