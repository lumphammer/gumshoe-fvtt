import { useCallback } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { assertGame } from "../../functions/isGame";
import { requestTurnPass } from "../../functions/utilities";
import { CombatantConfig } from "../../fvtt-exports";
import { InvestigatorCombatant } from "../../module/combat/InvestigatorCombatant";
import { assertTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";

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

  const onTakeTurn = useCallback(() => {
    assertGame(game);

    // call `requestTurnPass` on everyone's client - the GM's client will pick
    // this up and perform the turn pass
    requestTurnPass(combatant.id);
  }, [combatant.id]);

  const onAddTurn = useCallback(() => {
    assertTurnPassingCombatant(combatant);
    void combatant.system.addPassingTurn();
  }, [combatant]);

  const onRemoveTurn = useCallback(() => {
    assertTurnPassingCombatant(combatant);
    void combatant.system.removePassingTurn();
  }, [combatant]);

  const sheet = combatant.token?.actor?.sheet;
  assertApplicationV2(sheet);

  const openSheet = useCallback(() => {
    void sheet.render({ force: true });
  }, [sheet]);

  return {
    onConfigureCombatant,
    onRemoveCombatant,
    openSheet,
    localize,

    onTakeTurn,
    onAddTurn,
    onRemoveTurn,
  };
};
