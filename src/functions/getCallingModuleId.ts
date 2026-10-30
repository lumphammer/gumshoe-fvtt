/**
 * The ID of the Foundry module whose code appears first in a stack trace (from
 * `new Error().stack`), if any. Module code is served from
 * `.../modules/<id>/`.
 */
export const getCallingModuleId = (stack: string | undefined) =>
  stack?.match(/\/modules\/([^/?#\s]+)\//)?.[1];
