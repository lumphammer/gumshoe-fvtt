# Browser tests

End-to-end tests with [Playwright](https://playwright.dev/), driving a real
Foundry server in a headless Chromium.

These aren't part of `pnpm check` or CI yet: they need a licensed Foundry.

## Running them

1. Build the system: `pnpm build`. The tests run against `build/`, not the
   Vite dev server, so rebuild after changing code.
2. Start the test Foundry: `pnpm e2e:foundry up`. This runs Foundry in a
   podman container called `fvtt-e2e` on http://localhost:30099, with its own
   data folder (`~/foundrydata/e2e`). It copies the signed licence from the
   `dataPath` in `foundryconfig.json`. See the top of
   [`scripts/e2e-foundry.sh`](../scripts/e2e-foundry.sh) for the settings.
   `pnpm e2e:foundry down` stops it.
3. Install Chromium the first time: `pnpm exec playwright install chromium`.
   On a minimal Linux (e.g. a Fedora toolbox) it may also need some system
   libraries: `pnpm exec playwright install-deps chromium` installs them on
   Debian and Ubuntu, and on Fedora `ldd` on the browser binary shows what's
   missing.
4. `pnpm e2e`. Add `--ui` or `--headed` to watch, or
   `pnpm exec playwright show-trace test-results/.../trace.zip` to step
   through a failure.

To use a different Foundry, set `E2E_FOUNDRY_URL`, and `E2E_FOUNDRY_DATA` to
its data folder if it's on this machine. It must be licensed and have no admin
password. If the data folder isn't here, the system must already be installed.

## How it works

- [`globalSetup.ts`](globalSetup.ts) shuts down and deletes the world
  `investigator-e2e`, copies `build/` into Foundry's systems folder, then
  creates a fresh world and launches it, using the same HTTP requests as
  Foundry's setup screens. It's a copy, not a symlink, because compendium
  packs are LevelDB databases, which only one Foundry can have open at once.
  Foundry only reads `system.json` when it starts, so if that has changed,
  setup stops and asks you to `pnpm e2e:foundry restart`. Then it logs in as the Gamemaster and saves the
  session (to `.auth/gm.json`) for every test to reuse. It also marks the
  welcome tour as done and turns the canvas off, which avoids the "no
  hardware acceleration" warning and makes pages load faster.
- The tests share that one world and run one at a time. Each test should
  create what it needs (with its own names) rather than relying on what
  earlier tests left behind.
- Import `test` and `expect` from [`foundry.ts`](foundry.ts): its `page`
  starts in the game, ready.
- Set up data through Foundry's API in `page.evaluate` (e.g.
  `Actor.create(...)`), which is fast and doesn't depend on the UI. Use
  locators and clicks for the thing you're actually testing. Code inside
  `page.evaluate` is typechecked against fvtt-types like the rest of the
  system.
- Force dice with `CONFIG.Dice.randomUniform = () => 0.01` (every die
  rolls 6) or `0.99` (1s).
