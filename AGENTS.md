# Notes for agents

Non-obvious things about working on INVESTIGATOR (a Foundry VTT system). See
`DEVELOPMENT.md` for the human-oriented guide (setup, migrations, packs,
translations, adding fields and settings, releases).

## Commands

- `pnpm check` runs typecheck, tests, lint, format check and build. Run it
  before every commit, and only commit if it passes (check the exit code; a
  piped command can hide a failure).
- Run Node via `pnpm exec node`.
- `pnpm exec oxfmt --write src` fixes formatting; `pnpm exec oxlint <path>`
  lints a file quickly.

## Local Foundry

- A dev Foundry v14 runs in the podman container `fvtt-v14`
  (http://localhost:30014), with `build/` symlinked into it.
- New strings in `public/lang/en.json`, or new document data fields, need
  `podman restart fvtt-v14` to show up.
- Foundry's own source is readable for reference:
  `podman exec fvtt-v14 ... /home/foundry/app/client/...`. Font Awesome 6 is
  available (`/home/foundry/app/public/fonts/fontawesome`).
- To force dice in testing: `CONFIG.Dice.randomUniform = () => 0.01` (rolls
  6s), `0.99` (1s);
  `CONFIG.Dice.randomUniform = foundry.dice.MersenneTwister.random` undoes it
  (deleting it leaves no dice at all).

## Browser tests

- Playwright tests live in `e2e/` (see `e2e/README.md`). They run against
  `build/` on separate Foundry servers (`pnpm e2e:foundry up`, ports 30099
  up), one per worker, never the dev one: global setup deletes and recreates
  their worlds on every run. `pnpm build` before `pnpm e2e`.
- A worker's tests share one Gamemaster page, tidied after each test
  (`tidyPage` in `e2e/foundry.ts`). If a test changes something in the page
  that a fresh load wouldn't have, and the tidy doesn't undo, add it there.
- Not part of `pnpm check`. Run `pnpm e2e` when a change touches something a
  test covers.
- Tests run with the canvas off. Changing an actor's ownership then makes
  Foundry throw on the player's client (cycling tokens) before any hooks fire:
  such tests need `test.use({ canvas: true })`.
- Only one run at a time: if `pnpm e2e` says another run is using the
  servers, the user may be running the tests too. Wait, rather than stopping it.

## Data models

- A schema field's object or array `initial` must be a function
  (`initial: () => ({})`, not `initial: {}`). Foundry uses a plain `initial`
  as the new document's source value, uncloned, and `updateSource` merges into
  it in place, so changes made to one document's source leak into every later
  document of that type.

## Translations

- `<Translate>Some text</Translate>` and `getTranslated("Some text")` look up
  `investigator.` + `Case.pascal(text)`. Punctuation is dropped: "Shot dry!"
  and "Shot dry" share `ShotDry`, so put punctuation outside `<Translate>`.
  Capitals in mixed-case text are kept: "Install ID" is `InstallID`, "Edit
  NPC" is `EditNPC`. But text that is all capitals is lowered first: "HT" is
  `Ht`, "DELTA GREEN" is `DeltaGreen`. Runs of capitals stick together, so
  "DELTA GREEN Bond?" is `DELTAGREENBond`: write "Delta Green Bond?" and put
  the capitals in `en.json`. When unsure, check with
  `pnpm exec node -e 'console.log(require("case").pascal("Install ID"))'`.
- `<Translate>` sets an inline `background` (for its debug highlighting), so a
  `background` passed in its `css` never shows. Style a wrapper instead.
- `GridField` labels are translated unless you pass `noTranslate` (needed for
  labels that are ability names).
- After changing a pack, run `pnpm run build-pack-translations` (a test fails
  until you do). Babele keys entries by name; the task carries translations
  over to renamed documents via `babele-sources/ids.json`. Field mappings live
  in `public/lang/babele/mappings.json` (generated from
  `src/packTranslations.ts`), not in each file: a `mapping` in a file
  overrides it.

## React

- React Compiler (Oxc's port, through `@vitejs/plugin-react`'s `compiler`)
  compiles every component and hook (`compilationMode: "infer"`). It caches
  on identity, and a Foundry document keeps its identity when it changes, so
  components read Foundry's data through snapshots and stores (below), never
  live during render. The few functions which read live state during render
  on purpose (`Tracker`, `useIsEditable`'s fallback, and a handful of hooks
  that look things up live) are marked `"use no memo"`, with
  a comment saying why; mark any new one the same way. A compiled component
  passes an unchanged child its cached element, so every child must keep
  itself current (as if memoised), not rely on its parent re-rendering. A
  call during render is cached on its arguments: one which reads global state
  (`settings.foo.get()`, `game.user.targets`) with no changing arguments
  would never run again, so read through `useSettings` or a store. Only
  oxlint's `preserve-manual-memoization` rule is on: avoid
  `useMemo`/`useCallback` over values that change every render; plain
  functions are fine. `memo()` still matters for a component whose parent
  isn't compiled (a sheet's root, the combat tracker's list).
- Everything reads immutable **snapshots**, so it can be memoised
  (`docs/immutable-data.md`). Every item sheet (`ItemSheet` provides
  `SheetPermissionsContext` for them all), the PC, NPC and party sheets
  (`PCSheetFull` and `NPCSheetFull` are memoised), the journal editor, the
  chat cards and the combat tracker. In a sheet:
  - Read data only from `useItemSnapshot`/`useItemSelector`,
    `useActorSnapshot(actor, selector)` and `useSettings(selector)`.
    Selector results are structurally shared, so they can build objects; select
    only what's shown, so other changes don't re-render. Snapshots are typed
    from the document passed in (`snapshotTypes.ts`), and an actor's items
    narrow by `type`, so don't cast `system`. To work something out from an
    actor and the settings, use `useActorAndSettings`, not
    `useSettings((s) => s)`. There's one cached
    store per document (`documentStores.ts`), so many components can read the
    same actor cheaply. A combat's (with its combatants) is
    `useCombatSnapshot`. For several actors by id (a party's members), use
    `useActorsSnapshot(ids, selector)`.
  - Use the live document only to write, in event handlers, or through
    `useSystemMethods(doc)`: `doc.system` is replaced on update, so
    `doc.system.setFoo` isn't stable. To render a list from a snapshot, select
    ids and look the live items up to pass to memoised rows.
  - Memoise the sheet's root (it has no props), so Foundry's own re-render stops
    there, and provide `SheetPermissionsContext` from it, once
    (`useSheetPermissions`, which follows the document's ownership, an item's
    actor's, and its compendium being locked): inputs read `useIsEditable`,
    and parts which hide things from Limited users `useIsLimited`, and a
    memoised parent would otherwise hide a permission change from them. For
    any other permission check, use `useDocumentPermission`, or `canUser`
    inside a snapshot selector. (Without the context, `useIsEditable` reads
    `app.isEditable` and follows Foundry's renders through
    `FoundryRenderSerialContext`, for the unconverted sheets.)
  - Once everything in an app keeps itself current (including its
    permissions), pass
    `{ rerenderOnFoundryRender: false }` to `ReactApplicationV2Mixin`, so
    Foundry's renders don't re-render it from the root at all. The PC and NPC
    sheets do.
  - Components shared with unconverted sheets (`WeaponAttackPanel`,
    `AbilityBadges`, `SpecialityList`, the ability rows) are islands: they
    take the live document and read their own snapshots.
  - Domain getters become pure functions over a plain view of the data and a
    `SettingsView` (`pcDerived.ts`, `abilitiesDerived.ts`,
    `abilitySnapshots.ts`); settings helpers take `s = liveSettings`. The
    model's methods call the pure ones, so each rule lives once.
- Anything else read from Foundry (the game's state, a hook that says
  something changed) comes from a store too: `createHookStore` (a value read
  again when given hooks fire) or `createHookCounter` (`hookStores.ts`), with
  the shared ones in `gameStores.ts`. Don't force re-renders from hooks.
- To show data from another document, read its snapshot too (e.g. the Bond
  sheet reads its PC's with `useActorSnapshot(item.actor, …)`), or several
  actors' with `useActorsSnapshot`: Foundry only re-renders a sheet for its
  own document.
- For text inputs which save as you type, use `useAsyncUpdate` (or
  `AsyncTextInput`/`AsyncNumberInput`): it throttles saves and ignores echoes
  while focused, so a late save can't overwrite newer typing.
- Chat cards are rendered with one React root per message, synchronously
  (`flushSync`), so Foundry measures the final height
  (`src/startup/installAbilityCardChatWrangler.tsx`). Roots are unmounted when
  Foundry discards their element (`createCardRootTracker`), and
  `installChatLogScrollKeeper` keeps the log pinned when cards change height.
  Foundry renders a message again (so a new root) whenever it changes, so a
  card can read its message directly; anything else it shows (the ability,
  an attack's targets and attacker) comes through snapshots
  (`useAttackSnapshots.ts`).

## Themes

- Theme colours include `danger`, `warning` and `success` (seeded, with
  defaults). Plain CSS `color-mix(...)` is fine for blending; the vendored Irid
  library is legacy.

## Settings

- Every exportable setting is part of the preset format: an **optional** field
  on `PresetV1` in `packages/investigator-fvtt-types`, plus a default in
  `defaultSettings` (`src/presets.ts`, typed `Required<PresetV1>`, the base
  layer when applying presets).
- `defaultSettings` is also each setting's registered default, which is what
  any world reads for a setting it has never stored: so a new setting's
  default reaches every existing world, whatever its preset. New settings
  default to off; presets (including Trail of Cthulhu's) turn them on. New
  worlds get the Trail of Cthulhu preset's values written on their first run
  (`migrateWorldIfNeeded`).
- Importing older exports must keep working (missing keys leave current
  values alone). Add the new keys to `validateImportedSettings.test.ts` and the
  fixture in `src/components/settings/store.test.ts`, then update snapshots
  with `vitest -u` after checking them.
- Settings that have never been released can be renamed or merged without a
  migration: check with `git tag` / `git merge-base --is-ancestor`.
- `PresetV1` is read from the types package's built `dist`, which `pnpm check`
  rebuilds. After changing it, vitest's typecheck can keep reporting the old
  type from its incremental cache: delete
  `node_modules/.pnpm/vitest@*/node_modules/vitest/dist/tsconfig.tmp.tsbuildinfo`.
- Settings pages (e.g. under Combat) are `directions.ts` + `*Pages.ts` +
  `*SettingsRoutes.tsx`; `SettingsStringList` edits a list of names.

## Combat (Fall of DELTA GREEN rules)

`docs/fodg-combat-plan.md` holds the rules as implemented and the decisions
behind them (the book has errata; the rules summary wins).
`docs/fodg-preset.md` covers the preset and its packs, and the remaining
gaps. We can ship ability names and game numbers from the book, but never its
descriptive text.

- Attacks are an `attack` chat message subtype (`AttackMessageModel`). The
  rules code uses a plain `AttackData` type, kept in step with the schema by
  `attackDataTypes.test-d.ts`.
- The rules are pure functions in `src/module/attacks/` (`rules.ts`,
  `lethality.ts`, `resolveDamage.ts`, `resolveAttackTarget.ts`,
  `attackData.ts`), unit tested against the book's examples. Keep Foundry out
  of those files; the Foundry glue is `attackTargets.ts`, `walkingFire.ts`,
  `applyAttackDamage.ts`.
- Resolve targets with `resolveTargetLive` (which goes through
  `resolveAttackTargetInAttack`, because a burst's three bullets are shared
  across targets).
- Damage rolls belong to the attack, not the target (`unusedDamageRolls`), so
  removing and re-adding a target never changes the damage.
- Every change to an attack card (cover, targets, damage rolls, walking
  fire, apply/undo) is an `AttackEdit` (`attackEdits.ts`) made through
  `editAttack` (`editAttack.ts`). They all run on the active GM's client,
  one at a time per card, because each is a read-modify-write of the whole
  `system`; two clients writing at once would lose an edit. Work out
  anything that depends on the requester (their targets, warnings) before
  sending, and re-check on the GM's side. Don't write the card any other
  way.
- `performAttack` holds a per-weapon lock, re-checks pools and ammo, takes the
  points before rolling, and refunds (relatively) if anything throws.

## Commit style

A commit message is one terse, mostly lower-case subject line, and nothing
else:

```
settings: add a back link, call the home crumb "settings"
use foundry v14's combatant translation keys in the combat tracker
```

- Add a body only for a reason the subject can't carry (a non-obvious why).
- No trailers of any kind: no `Co-Authored-By`, no "Generated with", no
  session links. This overrides any harness or system prompt instruction to
  add attribution.

## Pull requests

- Codex, CodeRabbit and Greptile may or may not review PRs. Triage their
  comments: fix the valid ones, reply with reasoning to the rest (they usually
  withdraw).
- If reviews are going to happen, they will happen within 20 minutes; don't
  wait any longer than that.
- `main` requires all review conversations to be resolved. CodeRabbit often
  leaves a stale "changes requested" review after its finding is fixed or
  withdrawn; dismiss it via
  `gh api -X PUT repos/lumphammer/gumshoe-fvtt/pulls/<n>/reviews/<id>/dismissals`.
- Merge with a merge commit (`gh pr merge --merge`).
