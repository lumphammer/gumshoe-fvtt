// Types for the code the tests run in the page with `page.evaluate`. This is
// a separate TypeScript project from the system, so these don't leak into it.

declare module "fvtt-types/configuration" {
  // tests only run code in the page once the game is ready
  interface AssumeHookRan {
    ready: never;
  }

  interface SettingConfig {
    // namespace -> tour id -> index of the step the user has reached
    "core.tourProgress": Record<string, Record<string, number>>;
  }
}

export {};
