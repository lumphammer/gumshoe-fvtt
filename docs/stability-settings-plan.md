# Sanity & Stability settings

Stability, Bonds, Stability states, trauma and Sanity started out as Fall of
DELTA GREEN rules with some hard-coded parts (three kinds of trauma, which
ability Bonds spend on, the Violence-capped abilities). This reworks them
into one settings page whose subsystems other GUMSHOE games can configure.

Sanity is deliberately thin. The books' rules are vague and inconsistent, so
tables will house-rule it; the only mechanical piece is the cap on its
rating. Revelations aren't encoded: the table is a guideline, not a set of
options.

## Settings

None of these have been released, so they're renamed and reshaped freely,
without migrations.

**Sanity & Stability** (menu page)

| Key | Label | Default | FoDG |
| --- | --- | --- | --- |
| `useStabilityRules` | Use Stability rules? | false | true |
| `stabilityAbility` (was `bondStabilityAbility`) | Name of Stability ability | Stability | |
| `useSanityRules` | Use Sanity rules? | false | true |
| `sanityAbility` | Name of Sanity ability | Sanity | |
| `sanityCapAbility` | Sanity rating capped by | Cthulhu Mythos | The Unnatural |
| `sanityCapBase` | Sanity cap before that | 10 | |

The rest of the page only shows when `useStabilityRules` is on, and nothing
on it does anything when it's off. The Sanity rows show only when
`useSanityRules` is on. Sub-pages:

- **Stability states**
  - `useStabilityStates`: Use Stability states?
  - `stabilityStates`: `{shaken, shattered, gone}`, each `{name, upTo}`.
    `upTo` is the highest pool in that state (0, −6, −12 by default).
- **Bonds**
  - `useBonds`: Use Bonds?
  - `bondRebuildSpendCategory`: Category spent when rebuilding Bonds.
  - Bonds are spent on the Stability ability, so they have no ability setting
    of their own.
- **Trauma types**
  - `useTrauma`: Use trauma?
  - `traumaTypes`: a list. Each type opens its own page:
    - `id` (stable: actors' adaptation progress is keyed by it)
    - `name`
    - `difficulty`, and `adaptedDifficulty`
    - `causesSanityLoss`: Trauma causes Sanity losses? (only shown with Sanity
      rules on)
    - `useAdaptation`: Use adaptation?
    - when adapting is on:
      - `cappedAbilities`: Abilities capped by adaptation
      - `capsBonds`: Caps Bonds?
      - `refreshPenalty`: Refresh penalty

`violenceCappedAbilities` goes: it's now Violence's `cappedAbilities`.

The FoDG preset's trauma types keep the ids `violence`, `helplessness` and
`unnatural`, so progress already on actors still lines up:

| | Difficulty | Adapted | Sanity loss | Adaptation | Capped | Caps Bonds | Refresh penalty |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Violence | 4 | 2 | no | yes | Flattery, Inspiration, Negotiation, Reassurance | yes | 0 |
| Helplessness | 4 | 2 | no | yes | none | no | 1 |
| The Unnatural | 5 | 5 | yes | no | | | |

The base layer (`defaultSettings`) has no trauma types, and everything off.

## Trail of Cthulhu

The Trail of Cthulhu preset turns on Stability rules, Sanity rules (capped at
10 less Cthulhu Mythos) and Stability states, named as in the second edition:

| State | Pool at most |
| --- | --- |
| Shaken | 0 |
| Blasted | −6 |
| Doomed | −12 |

Its trauma types, neither with adaptation:

| | Difficulty | Sanity loss |
| --- | --- | --- |
| Non-mythos | 4 | no |
| Mythos | 5 | yes |

Bonds stay off.

Until now the Trail of Cthulhu preset was also the base layer and every
setting's registered default. A world reads the registered default for any
setting it has never stored, including every setting added since it last
saved, so turning these rules on there would have turned them on in every
existing world, whatever its preset. So:

- `defaultSettings` is the base layer and the registered defaults, with
  everything off. `pathOfCthulhuPreset` is an ordinary preset on top.
- A new world says it uses Trail of Cthulhu, but has stored nothing, so on its
  first run (`migrateWorldIfNeeded`) we write the preset's values.
- An existing world whose preset is Trail of Cthulhu, with Stability rules
  off, gets a one-time question for its GM: turn the new rules on now? We
  don't do it unasked, because the campaign may be under way, and the world
  may never have picked a preset at all. "Yes please" writes just the Sanity &
  Stability settings, not the whole preset, which would overwrite the GM's
  other changes.

## Labels

Wherever "Stability" or "Sanity" appears in a label on these settings pages,
it's replaced by the configured ability name, if one is set. This uses
translation placeholders, e.g. "Use {Stability} states?". The menu's page
names stay fixed.

## Rules

What stays hard-coded:
- What the states do: Shaken adds 1 to Difficulties and Investigative spends
  ask first; becoming Shattered costs a rating point; Gone shows a reminder.
- An adaptation's rating cap (1), Bond cap (2), and the three boxes to adapt.
- A shock's Sanity loss: 1 for becoming Shaken, 2 for Shattered, only the
  worst per operation.

When several adaptations apply, they combine: a rating is capped if any of
them caps it, Bonds are capped if any of them does, and refresh penalties add
up.

When Stability states are off, trauma tests treat everyone as steady. There's
no Shaken penalty, no rating loss on Shattering, and no shocks, so no Sanity
loss. Adaptation progress never resets, because no loss leaves anyone Shaken.

### Sanity cap

With Stability and Sanity rules on, the Sanity ability's rating is capped at
`sanityCapBase` minus the cap ability's rating, never below 0. That's a cap
of 10 with no Mythos.

- The rating field won't go above it, and a hook lowers any change which
  would.
- When the cap ability's rating goes up, Sanity's rating comes down to the
  new cap without asking, along with its pool if that's above it.
- The badge reads "Capped at N" as for adaptations. The tooltip says where
  the cap comes from.

Nothing else about Sanity changes: it has a pool, and can be tested and spent
like any other ability.

## Actor data

- `adaptations` becomes a `TypedObjectField` of progress, keyed by trauma
  type id. Missing means 0.
- `unnaturalShockSanityLoss` becomes `shockSanityLoss`, since any trauma type
  can cause Sanity loss.
- Trauma test cards store the trauma type's name, so they read the same after
  the type is renamed or deleted.
