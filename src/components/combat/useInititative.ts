import { useCallback } from "react";

import {
  assertGame,
  requestTurnPass,
  systemLogger,
} from "../../functions/utilities";
import { useRefStash } from "../../hooks/useRefStash";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";

export const useInititative = (combat: InvestigatorCombat, id: string) => {
  assertGame(game);

  const combatantStash = useRefStash(combat.combatants.get(id));

  const onConfigureCombatant = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (combatantStash.current === undefined) return;
      const rect = event.currentTarget.getBoundingClientRect();
      new CombatantConfig(combatantStash.current, {
        top: Math.min(rect.top, window.innerHeight - 350),
        left: window.innerWidth - 720,
        width: 400,
      }).render(true);
    },
    [combatantStash],
  );

  const onClearInitiative = useCallback(() => {
    void combatantStash.current?.update({ initiative: null });
  }, [combatantStash]);

  const onDoInitiative = useCallback(() => {
    void combatantStash.current?.doGumshoeInitiative();
  }, [combatantStash]);

  const onRemoveCombatant = useCallback(() => {
    void combatantStash.current?.delete();
  }, [combatantStash]);

  const localize = game.i18n.localize.bind(game.i18n);

  const onTakeTurn = useCallback(() => {
    assertGame(game);
    if (combat.round === 0) {
      return;
    }
    systemLogger.log("turnPassingHandler - calling hook");
    // call `requestTurnPass` on everyone's client - the GM's client will pick
    // this up and perform the turn pass
    requestTurnPass(combatantStash.current?.id);
  }, [combatantStash, combat.round]);

  const onAddTurn = useCallback(() => {
    combatantStash.current?.addPassingTurn();
  }, [combatantStash]);

  const onRemoveTurn = useCallback(() => {
    combatantStash.current?.removePassingTurn();
  }, [combatantStash]);

  const openSheet = useCallback(() => {
    void combatantStash.current?.token?.actor?.sheet?.render(true);
  }, [combatantStash]);

  return {
    onDoInitiative,
    onConfigureCombatant,
    onClearInitiative,
    onRemoveCombatant,
    onTakeTurn,
    localize,
    onAddTurn,
    onRemoveTurn,
    openSheet,
  };
};
