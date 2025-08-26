export function registerHookHandler<K extends Hooks.HookName>(
  hook: K,
  fn: Hooks.Function<K>,
) {
  Hooks.on(hook, fn);
  return () => {
    Hooks.off(hook, fn);
  };
}
