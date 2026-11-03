# Browser tests

End-to-end tests with [Playwright](https://playwright.dev/), driving a real
Foundry server in a headless Chromium.

These aren't part of `pnpm check` or CI yet: they need a licensed Foundry.

## Running them

1. Build the system: `pnpm build`. The tests run against `build/`, not the
   Vite dev server, so rebuild after changing code.
2. Start the test Foundry servers: `pnpm e2e:foundry up`. The tests run in
   parallel, one worker per server, because a Foundry runs only one world at
   a time. This runs `E2E_FOUNDRY_SERVERS` of them (default 3), in podman
   containers: `fvtt-e2e` on http://localhost:30099, with its own data folder
   (`~/foundrydata/e2e`), then `fvtt-e2e-1` on 30100 (`~/foundrydata/e2e-1`),
   and so on. It copies the signed licence from the `dataPath` in
   `foundryconfig.json`. See the top of
   [`scripts/e2e-foundry.sh`](../scripts/e2e-foundry.sh) for the settings.
   `pnpm e2e:foundry down` stops them all. Starting them also installs the
   latest releases of Babele and libWrapper into their modules folders, for
   the pack translations test; `pnpm e2e:foundry restart` updates them.
3. Install Chromium the first time: `pnpm exec playwright install chromium`.
   On a minimal Linux (e.g. a Fedora toolbox) it may also need some system
   libraries: `pnpm exec playwright install-deps chromium` installs them on
   Debian and Ubuntu, and on Fedora `ldd` on the browser binary shows what's
   missing.
4. `pnpm e2e`. It uses as many servers as `E2E_FOUNDRY_SERVERS` says, so
   set it the same way for both commands to use fewer. Add `--ui` or
   `--headed` to watch, or
   `pnpm exec playwright show-trace test-results/.../trace.zip` to step
   through a failure.

To use different Foundry servers, set `E2E_FOUNDRY_URL` to their URLs, and
`E2E_FOUNDRY_DATA` to their data folders if they're on this machine (both
comma-separated, in the same order). They must be licensed and have no admin
password. If a data folder isn't here, the system must already be installed.

## How it works

- On each server, [`globalSetup.ts`](globalSetup.ts) shuts down and deletes
  the world
  `investigator-e2e`, copies `build/` into Foundry's systems folder, then
  creates a fresh world and launches it, using the same HTTP requests as
  Foundry's setup screens. It's a copy, not a symlink, because compendium
  packs are LevelDB databases, which only one Foundry can have open at once.
  Foundry only reads `system.json` when it starts, so if that has changed,
  setup stops and asks you to `pnpm e2e:foundry restart`. Then it logs in as the Gamemaster and saves the
  session (to `.auth/gm-0.json` and so on) for every test to reuse. It also marks the
  welcome tour as done and turns the canvas off, which avoids the "no
  hardware acceleration" warning and makes pages load faster.
- Each worker has a server, and so a world, of its own. A file's tests run
  one at a time, in one worker, and share its world. Each test should create
  what it needs (with its own names) rather than relying on what earlier
  tests left behind.
- Only one run can use the Foundry servers at a time ([`runLock.ts`](runLock.ts)): a
  second run stops straight away rather than trampling the first (logging
  its Gamemaster out, resetting its world, clearing its `test-results/`).
- Import `test` and `expect` from [`foundry.ts`](foundry.ts): its `page`
  starts in the game, ready. It's the same page for every test in a worker
  (loading the game is the slowest part of most tests): after each test it
  closes windows, puts the dice and settings back, and drops the test's
  routes and listeners. If a test reloads the page or changes localStorage
  (e.g. the language), the next test gets a fresh load. A test that fails
  throws its worker away, so the next one starts from scratch.
- Set up data through Foundry's API in `page.evaluate` (e.g.
  `Actor.create(...)`), which is fast and doesn't depend on the UI. Use
  locators and clicks for the thing you're actually testing. Code inside
  `page.evaluate` is typechecked against fvtt-types like the rest of the
  system.
- [`packTranslations.spec.ts`](packTranslations.spec.ts) switches Babele
  on for its own tests only, and checks a pack ability comes out translated
  in a few languages. Its expected values come from `public/lang/babele`, so
  pulling new translations doesn't break it.
- Force dice with `forceDice`, which lasts until the test ends.
