import { runtimeConfig } from "../runtime";
import { useRuntimeRegistries } from "./useRuntimeRegistries";
import { useSettings } from "./useSettings";

/** Resolve a theme, following defaults, installations, replacements and HMR. */
export const useTheme = (name: string | null = null) => {
  const defaultName = useSettings((s) => s.defaultThemeName);
  const { themes } = useRuntimeRegistries();
  return (
    themes[name ?? defaultName] ??
    themes["tealTheme"] ??
    runtimeConfig.themes["tealTheme"]
  );
};
