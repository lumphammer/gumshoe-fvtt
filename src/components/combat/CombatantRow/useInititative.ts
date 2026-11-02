import { useCallback } from "react";

import { openSheet } from "../../../functions/openSheet";
import { assertGame } from "../../../functions/isGame";
import { CombatantConfig } from "../../../fvtt-exports";
import type { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";

export const useInititative = (combatant: InvestigatorCombatant) => {
  assertGame(game);

  const onConfigureCombatant = useCallback(
    (event: Event) => {
      if (!(event.currentTarget instanceof HTMLElement)) return;
      const rect = event.currentTarget.getBoundingClientRect();
      void new CombatantConfig({
        position: {
          top: Math.min(rect.top, window.innerHeight - 350),
          left: window.innerWidth - 720,
          width: 400,
        },
        document: combatant,
      }).render({ force: true });
    },
    [combatant],
  );

  const onRemoveCombatant = useCallback(() => {
    void combatant.delete();
  }, [combatant]);

  const localize = game.i18n.localize.bind(game.i18n);

  const openActorSheet = useCallback(() => {
    openSheet(combatant.token?.actor);
  }, [combatant]);

  return {
    onConfigureCombatant,
    onRemoveCombatant,
    openSheet: openActorSheet,
    localize,
  };
};
