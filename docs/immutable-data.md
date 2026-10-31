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
- **fresh-and-share, per document:** use only *which* document the hook is
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

| Change | Objects replaced |
|---|---|
| an actor field | 5 (the path to the field) |
| one item | 5 |
| deleting an item from the middle of the list | 2 |

So the choice between them comes down to speed and robustness, not render
cost.

### Timings in Foundry

Times are ms per step: one update, or one bulk or create + delete operation.

| Step | diff-merge | whole actor | per document | per document, prepared |
|---|---|---|---|---|
| actor field (76 items) | 0.054 | 0.62 | 0.028 | 0.025 |
| one item (76 items) | 0.20\* | 1.0 | 0.022 | 0.054 |
| one item (228 items) | 0.042 | 1.3 | 0.007 | 0.011 |
| create + delete item (228 items) | 0.096 | 3.4 | 0.021 | 0.017 |
| every ability, one hook each (76 items) | 6.3 | 74 | 1.7 | 2.2 |
| every ability, one hook each (228 items) | 10.2 | **287** | 2.4 | 2.3 |
| every ability, coalesced (228 items) | 3.9 | 16 | 2.0 | 2.0 |

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
