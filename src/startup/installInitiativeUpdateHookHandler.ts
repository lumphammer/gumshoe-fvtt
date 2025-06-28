import { assertGame } from "../functions/isGame";
import { InvestigatorCombatant } from "../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../module/combat/turnPassingCombatant";
import { settings } from "../settings/settings";

export function installInitiativeUpdateHookHandler() {
  // on createCombatant, if you are the user wot done it, set the initiative.
  Hooks.on(
    "createCombatant",
    (combatant: InvestigatorCombatant, options: any, userId: string) => {
      assertGame(game);
      if (userId !== game.userId) {
        return;
      }
      if (settings.useTurnPassingInitiative.get()) {
        if (isTurnPassingCombatant(combatant)) {
          void combatant.system.resetPassingTurns();
        }
      } else {
        void combatant.doGumshoeInitiative();
      }
    },
  );
}
