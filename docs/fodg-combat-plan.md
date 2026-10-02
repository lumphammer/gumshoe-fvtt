# Fall of DELTA GREEN combat: implementation plan

Goal: give INVESTIGATOR the crunchy FoDG combat rules (Lethality, three-round
burst, full-auto, walking fire), built on a general "target and apply damage"
layer that benefits every preset.

Page references are to *Fall of DELTA GREEN* (combat chapter pp. 089–107, plus
the rules summary at the back of the book, which is clearer than the chapter
text and wins where they disagree).

## Rules as we will implement them

### Wound states (p. 094)

Derived purely from the Health pool — no separate status field:

| Health      | State             |
| ----------- | ----------------- |
| > 0         | OK                |
| 0 to −5     | Hurt              |
| −6 to −11   | Seriously Wounded |
| ≤ −12       | Dead              |

"Reduced to X" outcomes set Health to `min(current, X)`. Undo restores the
stored pre-application value.

A Hurt attacker adds +1 to their opponents' Hit Thresholds (p. 094).

### Lethality (p. 093 + rules summary + Impact rules)

A Lethality rating is `L<rating><asterisks><Hs>`, e.g. `L1`, `L2*`, `L1H`,
`L1**HH`. Modifiers stack. Roll one die `d` and compare against consecutive
bands:

| Die result                            | Outcome                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `d ≤ R`                               | Dies (Health → −12)                                                          |
| `R < d ≤ R + A`                       | Seriously Wounded (→ −6); if already Hurt or worse, dies                     |
| `R + A < d ≤ R + A + H`               | Hurt (→ 0); if already Hurt, Seriously Wounded; if already SW, dies          |
| `d > R + A + H`                       | Damage `5 × R + d`, minus armor                                              |

e.g. `L1**HH`: 1 kills; 2–3 Seriously Wounded; 4–5 Hurt; 6 does 11 damage.

- Armor only reduces the final damage band ("assuming there's a damage roll for
  you to survive").
- Full cover subtracts 1 from `R`, for both the band check and the `5 × R`
  damage (p. 096). `R` can therefore reach 0 while the attack is still a
  Lethality attack, so "has Lethality" is a separate flag from the rating.
- Targets immune to Lethality skip the bands: damage is `5 × R + d`, minus
  armor (p. 093).

### Gunfire on humans (p. 092)

Interpretation: the author uses "0 or below" to mean the Hurt band. Any gunfire
damage instance against a human that would leave them Hurt (0 to −5) does an
extra 6 damage. Applied per instance, so it can trigger on a target that was
already Hurt.

- Burst example (p. 100): 6 → 1 → −2 → −8. ✔
- Full-auto example (p. 100): **known erratum** — the numbers don't reconcile
  under any reading. Don't use it as a test case.

Applies to firearms only, to human targets only (ghouls and other once-human
monsters are exempt unless the Handler rules otherwise).

### Critical hits (p. 104)

A successful unmodified 6 with margin ≥ 5 over the Hit Threshold: roll two
instances of damage and add them together.

### Cover (p. 096)

Per-target, chosen on the chat card:

- Exposed: Hit Threshold −1
- Partial: no change
- Full: Hit Threshold +1, Lethality rating −1

### Three-round burst (p. 100)

Declare before rolling. Spend at least 3 Firearms points (they add to the
roll). Instances of damage per target: `1 + min(2, ⌊margin / 3⌋)`. Each
instance is applied in sequence (order matters for "already Hurt" and gunfire).

### Full-auto (p. 100)

Declare before rolling. Spend at least 5 points from Firearms, Athletics and
Stability combined; only the Firearms points add to the roll. Damage becomes
L1 (or the weapon's own Lethality for machine guns). Roll one Lethality die per
target downrange — the player picks the targets; no geometry checks.

Machine guns (BAR, M60, …) are always full-auto, use Heavy Weapons, and need no
minimum spend.

### Walking fire (p. 100)

From a full-auto or burst attack, spend either 2 Firearms/Heavy Weapons, or 1
Firearms/Heavy Weapons + 2 Athletics, to hit one more target within 3 yards of
the previous one. The *original* result must meet the new target's Hit
Threshold. Repeatable. A burst can never exceed three bullets in total.

### Shot Dry and Jams (p. 101)

- Shot Dry: unmodified 6 on a full-auto roll empties the weapon (ammo → 0),
  but grants two damage instances on two targets, or three on one target.
  Undisciplined firers also shoot dry on a 1, without the bonus damage.
- Jam: two consecutive unmodified 1s on a full-auto weapon jam it.

### Out of scope for now

Detailed armor (per damage type, shotgun spread, helmet head-only, body armor
removing an asterisk), explosion ranges, impact/falling, called shots,
suppressive fire, evasion, non-lethal attacks, rubber/special ammunition.

## Current code (as of `62c939fd`)

- `src/components/equipment/performAttack.ts` — rolls one hit + one damage die
  into a single `PoolTerm`, spends from one ability (+ a UI-only bonus pool),
  consumes `ammoPerShot`. No targets.
- `src/startup/installAbilityCardChatWrangler.tsx` /
  `src/components/messageCards/AttackCard.tsx` — card state is read from
  `data-*` attributes in the message HTML.
- Health is a general ability linked to resource `health` (or legacy-named
  "Health"); `installResourceUpdateHookHandler.ts` syncs pool ↔
  `system.resources.health`.
- Hit Threshold / Armor are preset-defined numeric stats
  (`system.stats.hitThreshold`, `system.stats.armor`); PCs have no Armor stat
  by default, so both must be treated as optional.
- `src/functions/systemSocketActions.ts` — player → GM socket requests.
- `src/components/settings/Combat/CombatOptionsSettings.tsx` — home for the
  new toggles.

## Architecture

1. **An `attack` chat message subtype** (`AttackMessageModel`), whose
   `system` data holds the weapon (UUID plus name/image snapshots), range,
   hit roll, damage formula, unused damage rolls, and the targets
   `{ tokenUuid, cover, armorOverride, damageRolls[], applied }`. The rules
   code works on a plain `AttackData` object; a type test keeps it in step
   with the schema. Attack messages from before the subtype (with `data-*`
   attributes) keep rendering as they always did, without targets.
2. **Pure rules functions** with Vitest coverage, using the book examples as
   cases: effective Hit Threshold, instance count (burst / crit / shot dry),
   `resolveLethality`, gunfire adjustment, sequential application → final
   Health + wound state.
3. **Lazy per-target damage rolls.** Instance count depends on the target's
   Hit Threshold and cover (both adjustable on the card), so dice are rolled
   when a target row is resolved, not up front. This also makes late-added
   targets and walking fire the same code path.
4. **Permissions.** The card author (and GM) can act on the card and update
   the message. Players may apply damage to any target; if they don't own the
   target token, the request goes to the GM client via a new socket action.
   Outcomes are computed at apply time from stored dice plus live target data.

## Data model changes

- **Weapon**
  - `lethality: { enabled, rating, asterisks, hs }`
  - `isGunfire: boolean`
  - `fireModes: "single" | "selective" | "alwaysAuto"`
  - `fullAutoLethality` (default L1, for selective-fire weapons)
  - `ammoPerBurst` (default 3), `ammoPerFullAuto` (default 10)
  - `lastRollWasOne` (or similar) for jam tracking
- **NPC**: `isHuman` (default true), `immuneToLethality` (default false). PCs
  are always human and never immune.
- **Settings** (combat options page):
  - `useDamageApplication`
  - `useGunfireOnHumans`
  - `useCriticalHits`
  - `useLethality`
  - `useAutofire` (burst + full-auto)
  - `useWalkingFire`
  - `useShotDryAndJams`
  - `athleticsAbilityName`, `stabilityAbilityName` (for full-auto / walking
    fire spends; names vary by preset and language)

### Settings, presets, and import/export

All new settings are part of the preset format and are exportable:

- Add each as an **optional** field on `PresetV1`
  (`packages/investigator-fvtt-types/index.ts`), with doc comments.
- Add each to `pathOfCthulhuPreset` in `src/presets.ts`. It is typed
  `Required<PresetV1>` and is the base layer in `applyPreset`
  (`src/components/settings/store.ts`), so applying an older preset that lacks
  the new keys falls back to these defaults (all FoDG options off; the ability
  names default to "Athletics" / "Stability").
- Create the settings with `exportable: true` and a validator (the
  `createSettingBoolean` / `createSettingString` factories provide one).

Import tolerance (general rule: importing an older export must always work):

- This already holds. `superValidator` (`src/settings/settings.ts`) wraps every
  exportable setting's validator in `.optional()`, and the import applies the
  result with `setSome`, which uses `Object.assign`. Keys that are missing from
  an old export leave the current values untouched.
- Add a regression test in `validateImportedSettings.test.ts`: an export
  without the new keys (e.g. the existing `ashen_stars_export.json` fixture)
  validates, and the new keys are absent from the result instead of being set
  to a value.
- The reverse case isn't covered: `superValidator` is `.strict()`, so
  importing an export from a *newer* version (one with keys this version
  doesn't know) is rejected. That's out of scope here; changing it would mean
  switching to `.strip()`.

## Phases

### Phase 1 — targeting and damage application (all presets)

- Capture `game.user.targets` at attack time into the message data; fall back to
  "apply to selected token(s)" if there were none.
- New attack card: per-target rows with effective Hit Threshold (cover
  selector, Hurt modifier), hit/miss, armor (overridable), each damage
  instance, predicted Health + wound state, Apply / Undo.
- Socket action for applying damage to unowned tokens.
- Gunfire-on-humans and critical hits (behind settings).
- `NPC.isHuman` field; `Weapon.isGunfire` field.

Decisions made while implementing Phase 1:

- A critical hit's two rolls are added together into **one** instance of
  damage, so armor applies to the total once.
- Armor uses the magnitude of the stat, so "Armor -1" (statblock style) and
  "Armor 1" both reduce damage by 1.
- Applying damage doesn't clamp Health to the Health ability's `min` (NBA NPC
  Health has `min: 0`, which would make wound states unreachable).
- A target without a `hitThreshold` stat uses 3.
- Attacks have **one target** (single shots, and bursts in Phase 3). Rolling
  with several tokens targeted uses the first, with a warning; the card's
  "Add target" / "Change target" button replaces it. A replacement target
  inherits the old one's damage rolls, since they belong to the attack. The
  data stays a list so full-auto and walking fire can allow more.
- Damage rolls belong to the attack, not the target. The attack's own damage
  roll (shown on the card) starts in `unusedDamageRolls`, and targets take
  from there before anything new is rolled. Removing a target puts its rolls
  back, so removing and re-adding (or changing) a target never changes the
  damage. Only rolls beyond those (e.g. a crit's second die) are fresh.
- Players see the target's Hit Threshold and hit/miss, but only see Health
  numbers if they have Observer permission on the target. Everyone sees the
  resulting wound state.
- Only the message author (or a GM) can edit targets or apply/undo damage.
  If they don't own the target, the active GM's client does it via socket,
  after checking the requester is the author or a GM.

### Phase 2 — Lethality

- Weapon Lethality fields + sheet UI (with a `L1**HH`-style display).
- `resolveLethality` with full band logic, cover reduction, immunity.
- `NPC.immuneToLethality`.

Decisions made while implementing Phase 2:

- Lethality uses the raw damage die, not the weapon's damage total. Weapon
  damage and range modifiers don't apply to it.
- Modifiers stack: the bands are `≤ R` kill, then one per asterisk
  (Seriously Wounded, or dead if already Hurt+), then one per H (Hurt, one
  step worse if already wounded), then `5 × R + die` damage. Wound results
  never raise Health.
- Under Lethality, a critical hit is **two separate Lethality rolls**,
  applied in order (adding Lethality dice together means nothing; cf. Shot
  Dry's "extra chances for Lethality").
- Gunfire on humans applies after Lethality too, including to an H result.
- Full cover reduces the rating by 1, so `L1` behind cover is `L0`: no kill
  band, `0 + die` damage.
- The weapon's Lethality is snapshotted onto the attack message when the
  attack is made (if the setting is on). Weapons take the book's notation
  in a single text field.

### Phase 3 — fire modes and three-round burst

- Fire-mode selector in the weapon attack panel; minimum spend of 3.
- Per-mode ammo consumption.
- Instance count from margin; sequential application.

### Phase 4 — full-auto

- Multi-ability spend UI (Firearms/Heavy Weapons + Athletics + Stability,
  total ≥ 5; only the weapon ability adds; no minimum for always-auto weapons).
- Full-auto Lethality per target.
- Shot Dry and Jams.

### Phase 5 — walking fire

- "Walk fire" card action with the two payment options.
- Compare the original result against the new target's effective Hit
  Threshold.
- Enforce the three-bullet cap for bursts.
