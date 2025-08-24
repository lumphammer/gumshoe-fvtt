import { useCallback } from "react";

import { assertApplicationV2 } from "../../../functions/assertApplicationV2";
import { assertGame } from "../../../functions/isGame";
import { CombatantConfig } from "../../../fvtt-exports";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";

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

  const openSheet = useCallback(() => {
    const sheet = combatant.token?.actor?.sheet;
    assertApplicationV2(sheet);
    void sheet.render({ force: true });
  }, [combatant.token?.actor?.sheet]);

  return {
    onConfigureCombatant,
    onRemoveCombatant,
    openSheet,
    localize,
  };
};
