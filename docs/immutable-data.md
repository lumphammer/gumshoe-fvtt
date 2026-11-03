# Immutable document data: snapshot strategies

Findings from exploring #1476: how to turn Foundry's mutable documents into
immutable, structurally shared data that a React tree can memoise against.
The benchmark code lives on the `immutable-data-bench` branch (kept for
reference, not for merging).

**Conclusion:** keep a snapshot per document, copied fresh from the
**prepared** document whenever a hook names it, and structurally shared with
the previous snapshot (`replaceEqualDeep`). Don't patch snapshots with hook
diffs, and don't copy the whole actor on every change.

## The problem

Foundry documents are mutable, so today the UI can't memoise: a sheet
re-renders in full when its own document changes, and anything it shows from
other documents (an item's pool on the actor's sheet, a weapon's ability) goes
stale unless a component subscribes to more hooks by hand
(`useRefreshOnActorItemChanges`).

If a sheet's root is given an immutable snapshot of **everything the tree
reads**, and the tree reads only that, both problems go away together:
invalidation is just "the snapshot changed", and memoisation falls out of
reference equality. This needs no central store; each sheet owns its
snapshot and subscribes for its own lifetime.

Two conditions make that work:

- **Convert a whole tree at a time.** A memoised tree with one component still
  reading the live document has the old bug in a new form.
- **Domain getters become pure functions over snapshots.** About 60 component
  files call methods such as `actor.system.getCategorizedAbilities()`, which
  walk the live document. They have to become, for example,
  `getCategorizedAbilities(snapshot)`, like the existing pure rules in
  `src/module/attacks/`.

## The strategies compared

All three keep an actor snapshot (the actor, its items and its effects) up to
date from the document hooks.

- **diff-merge:** patch the previous snapshot with each hook's diff, using
  `foundry.utils.mergeObject` (with `applyOperators: true`) inside immer's
  `produce`. This is what the combat tracker does today.
- **fresh-and-share, whole actor:** on any hook, copy the whole actor
  (`toObject()`) and share the unchanged parts with the previous snapshot.
- **fresh-and-share, per document:** use only _which_ document the hook is
  for. Copy just that document and share the unchanged parts. The **prepared**
  variant copies prepared data (`toObject(false)`, or `system.toObject(false)`
  for the actor) instead of source.

The sharing is done by `replaceEqualDeep(prev, next)`: it returns `next`, but
with every subtree that deep-equals the matching subtree of `prev` replaced by
`prev`'s, and returns `prev` itself if nothing changed. Array elements with an
`_id` are matched by id, not position, so deleting an item from the middle of
the list doesn't give a new identity to every item after it.

## Method

- **Fixture:** a real PC from the dev world (76 items, 171 KB of JSON), and
  the same PC with its items repeated three times (228 items).
- **Node (`pnpm bench`, vitest bench):** uses Foundry's own `mergeObject` and
  `deepClone`, copied out of the container. Before timing anything, it checks
  that each strategy stays deep-equal to the live data over a seeded random
  run of 1,465 changes.
- **Foundry (`pnpm bench:foundry`):** runs on the e2e Foundry (v14.368, in
  headless Chromium). Every strategy runs inside real hooks against a real
  actor, and is compared with the live document after every step. This run
  also records the real hook diffs, checks whether they share objects with
  `_source`, and counts frozen objects in `_source` afterwards.
- **Scenarios:**
  - an actor field
  - a long note (an HTML array)
  - one item
  - every ability at once (one `updateEmbeddedDocuments` call, which fires a
    hook per item), run both one hook at a time and coalesced into a single
    batch
  - creating and then deleting an item

## Results

### Sharing

All strategies replace exactly the same objects:

| Change                                       | Objects replaced          |
| -------------------------------------------- | ------------------------- |
| an actor field                               | 5 (the path to the field) |
| one item                                     | 5                         |
| deleting an item from the middle of the list | 2                         |

So the choice between them comes down to speed and robustness, not render
cost.

### Timings in Foundry

Times are ms per step: one update, or one bulk or create + delete operation.

| Step                                     | diff-merge | whole actor | per document | per document, prepared |
| ---------------------------------------- | ---------- | ----------- | ------------ | ---------------------- |
| actor field (76 items)                   | 0.054      | 0.62        | 0.028        | 0.025                  |
| one item (76 items)                      | 0.20\*     | 1.0         | 0.022        | 0.054                  |
| one item (228 items)                     | 0.042      | 1.3         | 0.007        | 0.011                  |
| create + delete item (228 items)         | 0.096      | 3.4         | 0.021        | 0.017                  |
| every ability, one hook each (76 items)  | 6.3        | 74          | 1.7          | 2.2                    |
| every ability, one hook each (228 items) | 10.2       | **287**     | 2.4          | 2.3                    |
| every ability, coalesced (228 items)     | 3.9        | 16          | 2.0          | 2.0                    |

\* The 76-item runs come first in the page, so they include JIT warm-up.

For reference, copying the whole actor costs 0.4–0.9 ms with `toObject()` and
0.5–1.8 ms with `toObject(false)`, on every call. The Node numbers rank the
strategies the same way.

- **Per document wins or ties everywhere.** The prepared variant costs almost
  nothing extra, because it only ever copies one document.
- **The whole-actor copy is ruled out.** Its cost grows with the size of the
  actor, not the size of the change, and a bulk update makes that hundreds of
  milliseconds.
- **diff-merge is acceptable but slower,** mainly on embedded changes, because
  of immer's proxies and freezing. One trap: searching a draft array makes a
  proxy of every element visited, so look items up in `original(draft.items)`.
- **Coalescing matters only for the whole-actor copy.** Per document doesn't
  need it, though batching hooks into one React update may still be worth
  doing.

## Other findings

- **Hook diffs** contain the changed fields plus `_id` and
  `_stats.modifiedTime`. Arrays are replaced whole. Deletions arrive as
  `ForcedDeletion` instances, so diff-merge must pass `applyOperators: true`
  (`performDeletions` is deprecated in v14).
- **No aliasing or freezing.** Diffs never shared objects with the document's
  `_source`, and after the immer runs nothing in any `_source` was frozen. The
  feared hazard (immer freezing objects that Foundry still holds) didn't
  happen for these updates.
- **A snapshot must subscribe to everything it contains, effects included.**
  Changing Health or Stability pools makes the system create or delete the
  Hurt and Shaken effects on the actor. The first in-Foundry run only listened
  to Item hooks, so the diff-based and per-document strategies drifted. The
  whole-actor copy looked right only because later hooks in the batch happened
  to recopy the effects. Every embedded collection the snapshot holds needs
  its create, update and delete hooks.

## What this means for the implementation

- **Use per-document fresh-and-share from prepared data.** This avoids
  depending on diff semantics (operators, how embedded changes are routed) and
  carries prepared values such as effect-adjusted pools, which a source-only
  snapshot can't.
- **Hooks only identify documents.** The snapshot never interprets a diff, so
  a missed field can't put it out of step. A missed hook still can, as the
  effects case showed.
- **A sheet's snapshot is the actor plus its items and effects.** Sheets that
  show more (the party sheet, the combat tracker) need their own snapshot
  function covering those documents and their hooks.
- **Writes stay on the documents.** Snapshots are read-only, and
  `useAsyncUpdate` keeps handling echoes while typing.
- **Prepared data only includes schema fields.** Anything the data models
  derive outside the schema has to be added to the snapshot explicitly, or
  computed from it by the pure getters.

## Caveats

- The browser page wasn't cross-origin isolated, so its clock is coarse. To
  compensate, each call was repeated until it had taken at least 1 ms.
- These are numbers from one machine, in Node and in headless Chromium.
- Only the update types listed above were measured. The aliasing and freezing
  results cover those, not every way Foundry can update a document.

## Reproducing

On the `immutable-data-bench` branch:

1. Copy Foundry's `common/` sources out of the dev container:
   `scripts/fetch-foundry-common.sh`.
2. Run the Node benchmarks: `pnpm bench`.
3. Run the Foundry benchmarks on the e2e Foundry: `pnpm build`, then
   `pnpm bench:foundry`. The report is written to
   `test-results/snapshots-bench.json`.

To re-export the fixture, run
`scripts/export-actor-fixture.ts <world data dir> "<actor name>" <out.json>`.

## Render timing

Separately from the snapshot strategies, `e2e/renderTiming.bench.ts` measures
what a sheet costs to re-render after a document changes. It's a baseline for
judging each sheet's conversion to snapshots.

### How it works

- A stand-in for React DevTools' global hook
  (`e2e/renderTiming/commitRecorder.ts`) is installed before React loads. It
  records every commit: when it happened, how long React spent rendering
  (with React's profiling build only), and how many components rendered
  rather than being skipped.
- Each scenario changes a document 20 times, after 3 warm-up changes. After
  each change it waits for React to go quiet, then reports:
  - the time from the document's hook to React's last commit;
  - the number of commits;
  - React's render time;
  - the components rendered, overall and per commit.

To run it on the e2e Foundry:

```sh
pnpm build:profiling   # React's profiling build, for render durations
RENDER_BENCH_LABEL=before pnpm bench:foundry e2e/renderTiming.bench.ts
```

Results go to `test-results/render-timing-<label>.json`. Run `pnpm build`
afterwards to put a normal build back.

**Use component counts to judge a change.** They're exact from run to run.
The millisecond figures can vary by 2× between runs of the same code, so
treat them as a rough indication.

### Equipment sheet, before and after snapshots

| Change          | Wall       | React      | Components rendered (per commit) |
| --------------- | ---------- | ---------- | -------------------------------- |
| a field, before | 2.3–3.5 ms | 1.0–1.2 ms | 116 (102, then 14)               |
| a field, after  | 2.7–3.4 ms | 1.0–1.4 ms | 127 (77, then 50)                |
| notes, before   | 2.0–2.7 ms | 0.7–1.0 ms | 91 (88, then 3)                  |
| notes, after    | 2.1–3.5 ms | 0.8–1.3 ms | 96 (57, then 39)                 |

As expected, a sheet this small shows no difference in time. The
per-commit counts show what happens on each update:

- **Before,** Foundry's re-render (`render()` → `root.render`) redraws the
  whole tree, then input effects make a small follow-up commit.
- **After,** the snapshot update renders from `EquipmentSheet` down, skipping
  the memoised parts. Then Foundry's re-render arrives and re-renders the
  unmemoised outer shell (`ItemSheet`, `ItemSheetFramework`) **a second
  time**.

**Once a sheet reads everything through snapshots, Foundry's re-render is
redundant.** `ReactApplicationV2Mixin` takes `{ rerenderOnFoundryRender:
false }` for such apps: it renders the React root once each time the app
opens, and ignores Foundry's later renders. The PC and NPC sheets use it
(their roots follow ownership through `useActorSheetPermissions`, and the
Limited views read snapshots too), and so do the party sheet and, once every
item type was converted, the item sheets (`ItemSheet` follows ownership
through `useSheetPermissions`).

### Baseline for unconverted sheets

These are from two runs of the current code. The PC sheet uses the fixture
PC (76 items).

| Scenario                                  | Wall     | React    | Components rendered |
| ----------------------------------------- | -------- | -------- | ------------------- |
| PC, Abilities tab: ability pool           | 12–28 ms | 10–23 ms | 1212                |
| PC, Abilities tab: actor health           | 21–28 ms | 17–23 ms | 1212                |
| PC, Combat tab: ability pool              | 5–11 ms  | 4–8 ms   | 422                 |
| PC, Equipment tab: ability pool           | 5 ms     | 4 ms     | 498                 |
| combat tracker, 12 combatants: initiative | 0.5 ms   | 0.1 ms   | 2                   |
| combat tracker, 12 combatants: next turn  | 4 ms     | 3 ms     | 402                 |

- **The PC sheet redraws all 1,212 components on its Abilities tab for one
  pool change.** That's where snapshots have the most to gain.
- **"Next turn" re-renders every row of the combat tracker,** even though
  the tracker is already memoised. The likely causes are dnd-kit's sortable
  context, or the rows reading `combat.turn` from the live document.

## Progress

Components rendered per change, before and after converting (from
`e2e/renderTiming.bench.ts`; the PC is the 76-item fixture):

| Change                                                      | Before         | After         |
| ----------------------------------------------------------- | -------------- | ------------- |
| weapon sheet: another ability on the actor                  | 37             | 0             |
| weapon sheet: its notes                                     | 85             | 48            |
| ability sheet: another ability on the actor                 | 34             | 0             |
| ability sheet: its notes                                    | 146            | 115           |
| PC, Abilities tab: an ability's pool                        | 1128           | 315           |
| PC, Abilities tab: the actor's Health                       | 1125           | 277           |
| combat tracker (12 combatants): next turn                   | 402            | 112           |
| combat tracker, header on props: next turn                  | 112            | 48            |
| turn-passing tracker (12): pass turn                        | 571            | 131           |
| turn-passing tracker, menus memoised: pass turn             | 131            | 49            |
| turn-passing tracker, menus memoised: a combatant's turns   | 69             | 28            |
| turn-passing tracker, menus memoised: next round            | 1567           | 583           |
| combat tracker, menus memoised: next turn                   | 48             | 39            |
| PC, Contacts tab (island → converted): an ability's pool    | 183            | 1             |
| PC, Contacts tab (island → converted): a contact's pool     | 183            | 42            |
| PC, MW items tab (island → converted): an ability's pool    | 139            | 1             |
| PC, MW items tab (island → converted): an item's name       | 139            | 18            |
| PC, Bonds tab (island → converted): an ability's pool       | 267            | 1             |
| PC, Bonds tab (island → converted): a Bond's points         | 187            | 20            |
| PC, Bonds tab, Establish Bond panel: an ability's pool      | 41             | 1             |
| PC, Bonds tab, Team Crisis panel: an ability's pool         | 109            | 1             |
| PC, Cards tab (island → converted): an ability's pool       | 146            | 1             |
| PC, Cards tab (island → converted): a card's subtitle       | 148            | 15            |
| PC, Cards tab, `CardDisplay` converted: a card's subtitle   | 15             | 10            |
| PC, Cards tab: renaming a category with every card          | 162            | 112           |
| PC, Cards tab: renaming a category with no cards            | 162            | 54            |
| PC, Moribund World Abilities tab: an ability's pool         | 944            | 311           |
| PC, Moribund World Abilities tab: the actor's Health        | 944            | 283           |
| PC, Abilities tab, panels memoised: an ability's pool       | 315            | 71            |
| PC, Abilities tab, panels memoised: the actor's Health      | 277            | 33            |
| PC, Combat tab, panels memoised: an ability's pool          | 410            | 166           |
| PC, Equipment tab, panels memoised: an ability's pool       | 486            | 242           |
| PC, Combat tab, weapons converted: an ability's pool        | 166            | 30            |
| PC, Equipment tab, converted: an ability's pool             | 242            | 30            |
| PC, Equipment tab, converted: an item's name                | 242            | 50            |
| NPC (12 abilities), panels memoised: an ability's pool      | 129            | 67            |
| NPC, panels memoised: the actor's notes                     | 96             | 34            |
| NPC, Combat tab, panels memoised: an ability's pool         | 100            | 38            |
| NPC, root memoised: an ability's pool                       | 67             | 35            |
| NPC, root memoised: the actor's notes                       | 34             | 2             |
| NPC, root memoised, Combat tab: an ability's pool           | 38             | 2             |
| PC, root memoised, Abilities tab: an ability's pool         | 71             | 39            |
| PC, root memoised, Abilities tab: the actor's Health        | 33             | 1             |
| PC, root memoised, Combat tab: an ability's pool            | 30             | 1             |
| PC, root memoised, Equipment tab: an ability's pool         | 30             | 1             |
| PC, re-render off, Abilities tab: an ability's pool         | 39 (2 commits) | 38 (1 commit) |
| PC, re-render off, Abilities tab: the actor's Health        | 1              | 0             |
| PC, re-render off, Combat/Equipment tabs: an ability's pool | 1              | 0             |
| NPC, re-render off: an ability's pool                       | 35 (2 commits) | 33 (1 commit) |
| NPC, re-render off: the actor's notes                       | 2              | 0             |
| PC, compiled, Abilities tab: an ability's pool              | 38             | 9             |
| PC, compiled, Equipment tab: an item's name                 | 20             | 8             |
| PC, compiled, MW Abilities tab: an ability's pool           | 28             | 3             |
| PC, compiled, Contacts tab: a contact's pool                | 41             | 22            |
| PC, compiled, MW items tab: an item's name                  | 17             | 10            |
| PC, compiled, Bonds tab: a Bond's points                    | 19             | 8             |
| PC, compiled, Establish Bond panel: a Bond's points         | 47             | 24            |
| PC, compiled, Cards tab: a card's subtitle                  | 9              | 5             |
| PC, compiled, Cards tab: renaming a category, every card    | 112            | 85            |
| NPC, compiled: an ability's pool                            | 33             | 9             |
| Cards tab compiled: renaming a category, every card         | 85             | 50            |
| Cards tab compiled: renaming a category, no cards           | 45             | 10            |
| equipment sheet compiled: a field                           | 100            | 57            |
| equipment sheet compiled: its notes                         | 69             | 32            |
| weapon sheet compiled: its notes                            | 48             | 29            |
| ability sheet compiled: its own pool                        | 141            | 88            |
| ability sheet compiled: its notes                           | 115            | 35            |
| turn-passing tracker compiled: next round                   | 583            | 158           |
| turn-passing tracker compiled: pass turn                    | 49             | 45            |
| turn-passing tracker compiled: a combatant's turns          | 28             | 22            |
| combat tracker compiled: next turn                          | 39             | 35            |
| shared inputs compiled: ability sheet, its own pool         | 88             | 68            |
| shared inputs compiled: Team Crisis panel, a Bond's points  | 118            | 99            |
| shared inputs compiled: equipment sheet, its notes          | 32             | 27            |
| shared inputs compiled: weapon sheet, its notes             | 29             | 24            |

The PC and NPC sheets' own components, and the islands they use, are
compiled by React Compiler (they're marked `"use memo"`). A compiled
component hands back the same element for a child whose props haven't
changed, so the child only re-renders for its own state and snapshots, as if
it were memoised. The children which read the live actor and re-rendered with
their panel (`StatField`, `PersonalDetailField`, `ImagePickle`, `BondBadges`,
`ItemSheetLink`) now read snapshots or take what they show as props. The
Cards tab sorts, groups and counts each card's name, `active` and categories
from the snapshot (`CardLayoutView`), and its lists read the categories
through `useSettings`; only `CardArray` looks the live cards up, to hand to
`CardArrayCard`. (Before, it re-rendered for the snapshot and sorted the live
cards. Compiled, that only kept working because the compiler happened not to
cache the sorted list.) The equipment, weapon and ability sheets are compiled too. The item sheets'
shared `ItemSheetFramework` reads the item's name, image and permissions
through snapshots itself. Now every item sheet reads snapshots (the Bond,
contact, personal detail, card and Moribund World item sheets too), so the
item sheet class passes `rerenderOnFoundryRender: false`, and `ItemSheet`
works out the theme (from the owner's snapshot) and provides
`IsEditableContext` for them all. Before, each change was committed twice:
once for the snapshots, then again for Foundry's own render. The Bond sheet
reads what it needs from its PC (their Stability ability, for burning and
rebuilding, and their Bond cap) and its linked actor's name (from
`getWorldActorsStore`) through snapshots; the contact sheet, its PC's
Network pool. Wall times barely change (they were around a
millisecond already).

The shared components these sheets use (the inputs in `components/inputs`,
`Translate`, `ImagePickle`, `TabContainer`, `Masonry` and the like) are
compiled too. The unconverted sheets use them as well, but they only take
props, so they re-render whenever those change. But an input inside another
(`TextInput` in `AsyncTextInput`) gets its cached element, and the
unconverted sheets don't provide `IsEditableContext`: there, `useIsEditable`
reads `app.isEditable` itself, and reads `FoundryRenderSerialContext` (which
the mixin changes on every Foundry render) so it re-renders with Foundry. `Translate` reads its debug
setting in a hook (`useDebugTranslations`), which isn't compiled.
`useIsDocumentOwner` (for `ImagePickle` and `NotesDisplay`) checks the
ownership in a snapshot selector: it was a `useMemo` on the document, so
it never noticed the ownership changing.

Every part of the PC and NPC sheets now reads snapshots, and both roots
(`PCSheetFull`, `NPCSheetFull`) are memoised, so Foundry's re-render stops
at `PCSheet`/`NPCSheet`. The header and side panels are memoised sections
(`PCSheetPanels.tsx`, `NPCSheetPanels.tsx`). On the way, the tabs not yet
converted sat in a `LiveActorIsland`, which re-rendered them on any change
to the actor, so the root could be memoised first. The Establish Bond and
Team Crisis panels select what they show from the actor's snapshot, through
pure getters (`getReformableBondsIn`, `getRebuildSpendAbilitiesIn`,
`getBondCapIn` and the like), and plan a crisis with `planCrisis` itself. A
Bond's points still re-render a whole panel (they show them). Team Crisis's
teammates are other actors: the panel (compiled) works them out with
`getCrisisTeammateCandidatesIn` (in `crisis.ts`) from `getWorldActorsStore`,
so it follows them being created, renamed, or added to the Agent's party.
(`getCrisisTeammateCandidates`, which checks the choice on the GM's side,
runs the same rule over the live actors.)

The party sheet reads its members with `useActorsSnapshot(ids, selector)`,
which subscribes to each member's store, and to `getWorldActorsStore` (an
entry for each of the world's actors: its id, uuid, type, name, and a party's
members), so
it follows members being deleted, or created after the party listed them. It
works out its rows (`buildRowData`) from plain views of the members and of
the packs' abilities (`PartyMemberView`, `PartyAbilityView`), each ability
known by its uuid, which its cells look up to open or copy it. It's compiled,
and passes `rerenderOnFoundryRender: false`. Before, it followed its members
by listening for item hooks itself, so it missed a member being renamed.

`CardDisplay` (shared with the card's own sheet) is memoised, and reads its
card and what it shows from the card categories through snapshots, so the
card's sheet follows a category being renamed too. Renaming a category with
no cards re-renders `CardsArea` (it shows the categories) and the
`AbilityBadges`, but none of the cards.

A new round in a turn-passing combat rendered 583 components (247 for the
round, then 28 for each combatant's turns): every row's turns remaining
really do change, and most of it was Emotion's wrappers for the elements
that change. Compiled, it's 158 (62, then 8 per combatant), as the compiler
keeps the parts of each row that didn't change. The tracker's components are
compiled apart from `Tracker` itself and its context (they read `game.combat`
and `game.combats`). The turns remaining come from `usePassingTurns`, a hook
which isn't compiled, so it reads the live combatant on every render; the
active row comes from the tracker's state, not the live combat.

The combat tracker's rows were already memoised, but the keyboard sensor's
options were a new object on every render: that made new sensors, so every
row got new drag listeners and re-rendered its contents. With the options
hoisted, only the two rows whose turn changed re-render: the row is told
whether it's active by the list, rather than reading `combat.turn` itself
(which a memoised row would miss). The classic header's parts
(`EncounterNav`, `ClassicTurnNav`, `ClassicToolsRow`) take props from
`Tracker`, not the context (which changes on every update), so a new turn
in the same round doesn't re-render them. `TurnPassingTurnNav` does the
same. In turn-passing rows, `TurnPassingInitiative` read the tracker's
context only to know whether it was the combatant's turn, so every row
re-rendered on every combat update. It now reads `CombatantActiveContext`
(per row) and `CombatRoundContext` (the round, which its turns remaining
depend on). Each row's menus re-rendered with it, because their items are new
elements every time. The GM's menu is now memoised apart from the row
(`TurnPassingMenu`). The row's context menu root (`NativeContextMenuWrapper`)
is given its `<li>` as a constant element (`RowListItem`), which reads the
row's state from `RowShellContext`: a change re-renders the `<li>` and the
menu's trigger, not Radix's whole menu tree. `RENDER_BENCH_NAMES=1` lists which
components rendered (build with `--minify false` for readable names).

The chat cards are compiled too. Each message gets a new React root whenever
Foundry renders it, which it does whenever the message changes, so a card can
read its own message (its rolls, an attack's `system`) directly: that can't
change under it. What else a card shows comes through snapshots: an ability
card's ability's name and picture (`useMaybeItemSelector`), and an attack
card's targets (`useTargetViews`, over each target's token actor with
`useActorListSnapshot`, and tokens coming and going) and the attacker's pools
for walking fire (`useWalkingFireOptions`). Before, every attack card in the
log re-rendered on every actor, item and token update in the world (token
updates include every move); now each follows only its own targets and
attacker, and a target's token being deleted shows it as missing. The rules
for what a target is (`getTargetActorInfoIn`) and how walking fire can be
paid for (`getWalkingFirePaymentsIn`) work on snapshots or the live actor,
so the GM's side checks the same rules.

The system settings screens are compiled as well. The settings they edit are a
working copy, the state of an immer reducer (`useSettingsState`), handed down
through `StateContext`, so they were already immutable. What they read live
is in hooks: which Misc pages show (`useVisibleMiscPages`: dev mode, a
migration error), the usage stats report (`useReport`), the presets and
themes installed (`useRuntimeRegistries`), and the Item compendiums
(`useItemPacks`, shared with the personal detail sheet, which follows the
compendium sidebar's renders).

The journal editor is compiled too, and passes `rerenderOnFoundryRender:
false`. It reads its entry and pages through `useJournalEntrySnapshot`, over
one store per entry (`getJournalEntryStore`, which copies only the page that
changed): the entry's name and CSS classes, which pages there are and their
order and indents, and each page's name, CSS classes, image and caption. It
looks a page up live only to hand to its editor, to write through. The HTML
editor (Monaco) is uncontrolled: it reads the page's content once, when it's
mounted, as before. Ownership comes from the snapshot's selector too, provided
through `IsEditableContext`; it re-renders when compendiums are configured,
since locking the compendium an entry is in changes a setting, not the entry.

## Review of the plumbing

A look over the conversion as a whole (after the journal editor was
compiled), for boilerplate and duplication. The core (`createSnapshotStore`,
`replaceEqualDeep`, the document stores and the hooks over them) is small and
sound. Most of the boilerplate is in the components that use it, and has a
few causes, listed here with what to do about each, in the order to do them.

1. **Dead code.** _Done._ `InvestigatorActor` kept an immutable copy of
   itself (`registerImmutableDataUpdateHandler`), merged with immer on every
   update, which nothing read.
2. **Stores and live reads written by hand.** _Done._ The actor and journal
   stores are both `createParentStore` (a document's own data, plus embedded
   lists patched by id), the item, settings and world actors stores are
   `createHookStore` (a value read again when given hooks fire), and
   `cachedPer` and `once` replace the get-or-create caches
   (`hookStores.ts`). What used to force a re-render on a hook is a store in
   `gameStores.ts`: the Item compendiums, the installed presets and themes
   (installing one now calls `investigator.runtimeConfigChanged`), the
   user's targets (as names), and counters for compendium configuration and
   tokens' actors, for what can't be copied.
3. **Permissions checked in many places.** _Done._ `useSheetPermissions`
   works for any sheet's document (actor, item or journal entry), following
   its ownership, an item's actor's, and its compendium being locked (which
   the item sheets used to miss). Each sheet root provides it once, through
   `SheetPermissionsContext`, which `useIsEditable` and `useIsLimited` read;
   the ability, equipment and weapon sheets and the framework no longer work
   it out again. Other checks are `useDocumentPermission` (now behind
   `useIsDocumentOwner`) or, in a list's selector, `canUser`.
4. **Untyped snapshots.** _Done._ Snapshots are typed by document type
   (`snapshotTypes.ts`): an actor's `system` from its type, and its items as a
   union by item type, so `item.type === c.bond` narrows `item.system`. The
   hooks infer the type from the document they're given (`useActorSnapshot`
   on a `PCActor` hands the selector a PC's snapshot, not null), and the pure
   finders narrow theirs (`OfType`), so the casts and `snapshot?.items ?? []`
   guards are gone (the few left are in pure helpers over a plain
   `ItemView`). `useActorAndSettings` selects from an actor and the settings
   together, which replaced every `useSettings((s) => s)`. Repeated
   selectors became `useRatingCap`, `getStabilityViewIn`,
   `useStabilityStateName` and the chat cards' `useAbilityCardHeader`. A
   hook for the sheet's own actor didn't seem worth it: getting it from the
   context and asserting its type is two explicit lines.
5. **Rules not yet moved.** _Done._ The rules components copied are pure
   functions now, which the models call: network contacts and their points,
   the Network ability, adaptation progress and personal details by slot
   (`pcDerived.ts`), the trackers' order (`abilitiesDerived.ts`), and whether
   a Bond can be rebuilt and how high it can go (`bonds/rules.ts`).
   `AbilityModel` delegates its specialities to `abilitySnapshots.ts`, and the
   model getters nothing called any more (an ability's unlocks, visible
   modifiers and speciality count, a character's tracker abilities and
   contact points, an item's theme) are gone.
6. **Small repeats.** _Done._ `openSheet` (22 copies), `useDragStart` (13),
   and `liveItems`/`liveItem`, which look live items up by id with a type
   guard instead of a cast (15). The ability rows share `AbilityNameLink`,
   and the abilities areas `getAbilityRowsIn` and friends
   (`abilitiesDerived.ts`). Pools are read from typed snapshots, so
   `getPoolOf` is gone.
7. **The combat tracker.** _Done._ It reads a combat store
   (`getCombatStore`, a `createParentStore` of the combat and its combatants,
   with the turn order), through `useCombatSnapshot`. The tracker's context
   holds only the round and turn, so a combatant changing doesn't re-render
   the list; each row selects its own combatant, takes its effects from its
   actor's snapshot (`getCombatantEffectsOf`), and its resource from
   `getCombatantResourceStore` (Foundry works the resource out when it
   prepares the combatant, with no hook, so that store follows the
   combatant's own callback). The immer diff-merging in `TrackerContext`,
   `CombatantContext` and `ClassicInitiative`, and the actor's
   hand-rolled effects handlers, are gone; immer is left only in the system
   settings screens' reducer.
8. **The Team Crisis window.** _Done._ It's compiled, takes its theme from
   the Agent's snapshot, and its app passes `rerenderOnFoundryRender: false`
   (the panel in it already read snapshots). Its theme rule (the
   character's sheet theme, or else the default) was written out in five
   places, and is now `useActorTheme`; the models' `getSheetThemeName` is
   gone.
9. **Compiling everything.** _Done._ React Compiler compiles every
   component and hook (`compilationMode: "infer"`), and the 259 `"use memo"`
   directives are gone. Nine functions which read live state during render
   on purpose are marked `"use no memo"`: `Tracker` (the live
   `game.combat`), `useIsEditable` (its fallback reads the live app),
   `usePassingTurns`, the attack cards' `useTargetViews` and
   `useWalkingFireOptions`, `BondActor`'s `useActorName`, `Translate`'s
   `useDebugTranslations`, and the settings screens' `useVisibleMiscPages`
   and `useReport`. The `memo()` wrappers stay: a compiled parent makes them
   redundant, but a component whose parent isn't compiled (a sheet's root
   under Foundry's render, the combat tracker's list under `Tracker`) still
   needs one to skip a re-render with the same props.

## Follow-up review: maintainability and remaining subscriptions

Review of the aggregate diff from `before-immutability` to `855bb52d`, against
#1476. The nine plumbing tasks above were marked done at the time of this
review; the following are additional findings and suggestions, all pending.

The architecture is sound, and the added code largely earns its keep. The
later consolidation commits already share subscriptions, permissions, sheet
opening, live-item lookup and domain rules. Keep the small document-specific
hooks, explicit selectors and model methods that delegate to shared rules.
The remaining opportunities call for focused extractions and stronger
interfaces, rather than another store framework or a generic sheet/form
abstraction.

### Maintainability

- [x] **Restore a shared, self-subscribing initiative picker.**
  `PCSheetPanels.tsx` and `NPCSheetPanels.tsx` duplicate the initiative
  heading/dropdown, settings selection and general-ability filtering. The
  migration deleted `CharacterCombatAbilityPicker` and distributed its
  responsibility into these parents. An `InitiativeAbilityPicker` taking
  the actor could own its selectors and setter, using the existing
  `getGeneralAbilityNamesIn`. This would also prevent initiative-only
  changes from invalidating the larger panels. This is the clearest
  immediate factoring win. Done: `InitiativeAbilityPicker` owns these subscriptions
  and writes; both panels now delegate to it.
- [x] **Preserve type information in derived-rule interfaces.**
  In `module/actors/pcDerived.ts`, `ItemView.type`, `ItemView.system` and
  `PCView.system` are `unknown`. Helpers recover their shape through
  assertions and string-keyed access such as `numberOf(item, "rating")`;
  `abilitiesDerived.ts` uses a similar approach. This accommodates live
  documents and snapshots, but a field rename can silently become a
  zero/default instead of a compiler error. Introduce small typed
  structural views for the data each rule needs, derived from existing
  schema types where practical, which both representations can satisfy.
  This is a maintenance concern, not a finding that the current
  calculations are wrong. Done: schema-derived item views now discriminate by
  type; rules read checked properties directly, and PC adaptations are typed.
- [x] **Check the configuration of `createParentStore`.**
  In `module/snapshots/documentStores.ts`, callers supply `TData`, but
  `ownData` returns only `object`, collections have arbitrary string keys,
  and serializers return `unknown`. `RefreshEmbedded` likewise accepts any
  key and data. Connect collection keys and serialized values to the
  resulting snapshot type, so a misspelled key or incorrect serializer is
  caught. Keep unavoidable Foundry casts inside the adapter. The shared
  lifecycle abstraction is useful; strengthen its existing interface. Done:
  collection keys now determine own-data omissions, serializer results and
  refresh arguments, with compile-time regression checks.
- [x] **Share the ability-list editors' repeated presentation.**
  `UnlocksEditorRow.tsx` and `SituationalModifiersEditorRow.tsx` repeat the
  number input, text input, delete button, layout and indexed callbacks.
  Their parent editors also repeat transition scaffolding. This duplication
  predates the migration. Extract a small number/text/delete row and, if it
  stays simple, an animated-list wrapper; keep domain-specific setters in
  the two editors. Done: both editors share `AbilityListEditor` transitions
  and `NumberTextEditorRow`; their setters remain explicit.
- [x] **Narrow the weapon edit row's selector.**
  `characters/Weapons/WeaponRowEdit.tsx` selects the entire weapon `system`
  although it displays only part of it. Changes to cost, lethality or fire
  modes therefore invalidate the row unnecessarily, contrary to AGENTS.md's
  guidance to select only what is shown. Select the displayed fields
  explicitly, making its dependencies clear and preventing newly added
  fields from automatically becoming rendering dependencies. This is an
  optimization inconsistency, not a correctness bug. Done: the selector names
  the displayed fields, and one range-input loop replaces six repeated inputs.
- [ ] **Separate current architecture guidance from historical findings.**
  The opening of this document describes root-owned snapshots and says no
  central store is needed; later sections describe shared stores and
  independently subscribing leaves. The comments in `PCSheetPanels.tsx`
  also describe Foundry renders stopping at panels, although those sheets
  now disable root re-renders. Put a short current-architecture section
  first, label the historical material, and update stale code comments.

### Remaining subscription gaps

These are code-path findings, not browser-reproduced bugs. Both concern
#1476's aim of plumbing immutable data through all components: opting out
of compiler caching does not itself subscribe to changes.

- [ ] **Subscribe to the actor's default turn count.**
  `combat/CombatantRow/CombatantTurnContext.ts` reads
  `passingTurnsRemaining` and `defaultPassingTurns` live in
  `usePassingTurns`. The latter depends on the actor's
  `initiativePassingTurns`, which the hook does not subscribe to. Changing
  "Number of turns" on the character sheet can leave the tracker's total
  stale until another relevant render. Select the combatant's `turnInfo`,
  the actor's default turns and the round explicitly, then call the
  existing pure `getPassingTurnsRemaining`. This removes the hidden
  dependency and the compiler escape hatch. Verify with a regression test
  that changes the actor's default without advancing combat.
- [ ] **Finish migrating theme consumers to the registry store.**
  `characters/SettingsArea.tsx` reads and enumerates `runtimeConfig.themes`
  directly. Installing or replacing a theme emits `runtimeConfigChanged`,
  but the component does not subscribe, so choices and display names can
  remain stale. Use the existing `useRuntimeRegistries`. Related direct
  lookups remain in `party/PartySheet.tsx` and `Suspense.tsx`; finish a
  shared, store-backed theme-resolution hook so callers need not know which
  registry and settings events to follow. Verify installation/replacement
  while the affected UI is already open.

### Review validation

The review ran 59 passing tests across seven files: `createSnapshotStore`,
`documentStores`, `hookStores`, `replaceEqualDeep`, `useSnapshot`,
`pcDerived` and `abilitiesDerived`. Full checks and browser tests were not
run. The maintenance suggestions above are judgments, except for the narrow
selector-guidance mismatch; the subscription findings need browser
regression coverage when addressed.
