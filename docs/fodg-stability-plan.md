# Fall of DELTA GREEN: Stability states and trauma tests

Gap 2 in [`fodg-preset.md`](fodg-preset.md). We can ship ability names and
game numbers from the book, but never its descriptive text.

## Rules as we read them

- **States** (p. 113), by Stability pool: above 0, steady; **Shaken** at 0
  to −5; **Shattered** at −6 to −11; **Gone** at −12 or less.
- **Shaken:** no Investigative spends, and +1 to the Difficulty of every
  General test (Stability too). With a disorder, a Difficulty 4 Stability
  test against an acute episode.
- **Shattered:** everything Shaken does, plus frenzy, flight or faint, 1
  Stability rating lost for good, and a new disorder. With a disorder
  already, a Difficulty 6 test against an acute episode, a relapse or
  another disorder. After the second time, mental illness tests get +1.
- **Gone:** one last act, then a new Agent.
- **Stability tests** against trauma (pp. 115–119): Violence and
  Helplessness at Difficulty 4 (2 when adapted, p. 120), the Unnatural at 5.
  Stability and Bond points can be spent. A failure loses the potential
  loss, on top of what was spent.
- **Unnatural shocks** (p. 121): becoming Shaken from one costs 1 Sanity
  rating, Shattered 2; only the worst once per operation.
- **Adaptation** (p. 120): three losses in a row to Violence (or
  Helplessness) without becoming Shaken.

## Design

Behind a setting, **Use Stability states?** (`useStabilityStates`), on the
Bonds settings page for now (the settings will be reorganised later). On in
the FoDG preset. The Stability ability is the one Bonds use
(`bondStabilityAbility`); Sanity is a new setting (`sanityAbility`, default
"Sanity").

Since reworked into the Sanity & Stability settings: see
[`stability-settings-plan.md`](stability-settings-plan.md). The Stability
ability is now `stabilityAbility`, the states' names and thresholds are
settings, the three traumas are configurable trauma types, and
`unnaturalShockSanityLoss` is `shockSanityLoss`.

Rules in `src/module/stability/` (pure, tested); Foundry glue alongside.

### Phase 1: states as statuses (done)

- Statuses `shaken`, `shattered` and `gone`, always registered (so they can
  be set by hand), with Foundry's own icons for now.
- With the setting on, they follow the PC's Stability pool, as wound statuses
  follow Health: stash the state in `preUpdateItem`, swap statuses in
  `updateItem` on the client that made the change, only when the state
  changes (so a status set by hand survives).
- The Stability ability shows the state as a badge.

### Phase 2: Shaken's effects (done)

- Spending from an Investigative ability while Shaken (or worse) asks first.
- A General test made while Shaken (or worse) gets a reminder on its card:
  +1 Difficulty. Tests don't take a Difficulty yet (#1428).

### Phase 3: trauma tests (done)

- On the Stability ability's test panel: a **Trauma** choice (none, i.e. an
  ordinary test, Violence, Helplessness, the Unnatural) and the **potential
  loss**. With a trauma chosen, the Difficulty is shown and the test is
  resolved:
  - Difficulty 4 (Violence, Helplessness), 2 when adapted, 5 (Unnatural);
    +1 when Shaken or worse before the test.
  - A failure loses the potential loss.
  - Getting worse (Shaken, Shattered, Gone) shows what that means on the
    card, as reminders: disorders aren't tracked.
  - Newly Shattered: the Stability rating drops by 1, automatically.
  - Unnatural: newly Shaken costs 1 Sanity rating, newly Shattered 2, less
    whatever this operation's shocks have already cost
    (`unnaturalShockSanityLoss` on the PC, cleared by Full Refresh, which we
    treat as the end of an operation).
  - Violence or Helplessness, not yet adapted: a loss which leaves the Agent
    steady ticks an adaptation box; one which leaves them Shaken or worse
    clears them. The third box adapts them (Violence caps ratings, without
    asking: it's the rules, not a choice).
- One chat card (mode `stability-test`, `TraumaTestCard`), settled when
  rolled. Rules in `trauma.ts` (`resolveTraumaTest`, the card record), glue
  in `traumaTest.ts`.

### Decisions

- The +1 for being Shaken is built into trauma tests (they have a
  Difficulty); elsewhere it's a reminder.
- "Made you Shaken" means the loss moved the Agent into a worse state than
  they were in after spending.
- Becoming Gone without passing through Shattered doesn't take a rating
  point: the Agent is lost anyway.
- Sanity lost to a shock comes off the rating, and the pool comes down to
  match.
- Not covered: pitch blackness (+1, the GM can mention it), the "only test
  when the potential loss goes up" scene rule, counting Shatterings, the
  Stress Penalties (p. 047), and Hit Threshold +1 for attacks while Shaken.
