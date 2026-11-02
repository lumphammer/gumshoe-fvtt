import { runtimeConfig } from "../runtime";

/**
 * The installed presets and themes. They're registered by adding to
 * `runtimeConfig`, which keeps its identity, so this hands back copies, read
 * on every render: hooks aren't compiled, and a compiled component reading
 * `runtimeConfig` itself would keep the first answer.
 */
export const useRuntimeRegistries = () => ({
  presets: { ...runtimeConfig.presets },
  themes: { ...runtimeConfig.themes },
});
