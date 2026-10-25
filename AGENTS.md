# Notes for agents

Non-obvious things about working on INVESTIGATOR (a Foundry VTT system). See
`DEVELOPMENT.md` for the human-oriented guide (setup, migrations, packs,
translations, adding fields and settings, releases).

## Commands

- `pnpm check` runs typecheck, tests, lint, format check and build. Run it
  before every commit, and only commit if it passes (check the exit code; a
  piped command can hide a failure).
- Run Node via `pnpm exec node`.
- `pnpm exec prettier --write src` fixes formatting; `pnpm exec oxlint <path>`
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
  6s), `0.99` (1s); `delete CONFIG.Dice.randomUniform` to undo.

## Browser tests

- Playwright tests live in `e2e/` (see `e2e/README.md`). They run against
  `build/` on a separate Foundry (`pnpm e2e:foundry up`, port 30099), never
  the dev one: global setup deletes and recreates its world on every run.
  `pnpm build` before `pnpm e2e`.
- Not part of `pnpm check`. Run `pnpm e2e` when a change touches something a
  test covers.
- Only one run at a time per Foundry: if `pnpm e2e` says another run is using
  it, the user may be running the tests too. Wait, rather than stopping it.

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
- `<Translate>` also gives its span a `title` (the translated text), which
  hides a `title` on anything around it, e.g. a button's tooltip. Pass the
  tooltip to `<Translate title={...}>` as well.
- `GridField` labels are translated unless you pass `noTranslate` (needed for
  labels that are ability names).
- After changing a pack, run `pnpm run build-pack-translations` (a test fails
  until you do). Babele keys entries by name; the task carries translations
  over to renamed documents via `babele-sources/ids.json`. Field mappings live
  in `public/lang/babele/mappings.json` (generated from
  `src/packTranslations.ts`), not in each file: a `mapping` in a file
  overrides it.

## React

- React Compiler is **not** used. Foundry's data is mutable, so the UI relies
  on full re-renders. Only oxlint's `preserve-manual-memoization` rule is on:
  avoid `useMemo`/`useCallback` over values that change every render; plain
  functions are fine.
- A Foundry sheet only re-renders when its own document changes. If it shows
  data from another document (e.g. a weapon panel showing its ability's pool),
  subscribe to hooks yourself: see `src/hooks/useRefreshOnActorItemChanges.ts`.
- For text inputs which save as you type, use `useAsyncUpdate` (or
  `AsyncTextInput`/`AsyncNumberInput`): it throttles saves and ignores echoes
  while focused, so a late save can't overwrite newer typing.
- Chat cards are rendered with one React root per message, synchronously
  (`flushSync`), so Foundry measures the final height
  (`src/startup/installAbilityCardChatWrangler.tsx`). Roots are unmounted when
  Foundry discards their element (`createCardRootTracker`), and
  `installChatLogScrollKeeper` keeps the log pinned when cards change height.

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

## Pull requests

- CodeRabbit and Greptile review every PR. Triage their comments: fix the
  valid ones, reply with reasoning to the rest (they usually withdraw).
- `main` requires all review conversations to be resolved. CodeRabbit often
  leaves a stale "changes requested" review after its finding is fixed or
  withdrawn; dismiss it via
  `gh api -X PUT repos/lumphammer/gumshoe-fvtt/pulls/<n>/reviews/<id>/dismissals`.
- Merge with a merge commit (`gh pr merge --merge`).
