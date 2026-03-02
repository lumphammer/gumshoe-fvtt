import { systemLogger } from "../../functions/utilities";

export function registerHookHandler<K extends Hooks.HookName>(
  hook: K,
  fn: Hooks.Function<K>,
  debug = false,
) {
  if (debug) {
    systemLogger.log(`Registering callback for ${hook} hook`);
  }
  Hooks.on(hook, fn);
  return () => {
    if (debug) {
      systemLogger.log(`Unregistering callback for ${hook} hook`);
    }
    Hooks.off(hook, fn);
  };
}
