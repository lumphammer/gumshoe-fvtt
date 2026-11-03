import * as c from "../constants";
import { useActorAndSettings } from "./useActorSnapshot";
import { useTheme } from "./useTheme";

/**
 * The theme for an actor's sheets (and its items'): the character's own sheet
 * theme, if it has one, or else the default. Follows both changing.
 */
export function useActorTheme(actor: Actor.Implementation | null) {
  const name = useActorAndSettings(
    actor,
    (snapshot, settings) =>
      (snapshot?.type === c.pc || snapshot?.type === c.npc
        ? snapshot.system.sheetTheme
        : null) || settings.defaultThemeName,
  );
  return useTheme(name);
}
