import { assertGame, isNullOrEmptyString } from "../functions/utilities";
import { settings } from "../settings/settings";
import { isActiveCharacterActor } from "../v10Types";

export const installActorCombatAbilityHandler = () => {
  Hooks.on(
    "preCreateActor",
    (
      actor: Actor,
      createData: { name: string; type: string; img?: string },
      options: any,
      userId: string,
    ) => {
      assertGame(game);
      if (game.userId !== userId) return;
      const defaultInitiativeAbility = settings.combatAbilities.get()[0];

      // set image
      if (
        defaultInitiativeAbility !== undefined &&
        isActiveCharacterActor(actor) &&
        isNullOrEmptyString(actor.system.initiativeAbility)
      ) {
        actor.updateSource({
          system: {
            initiativeAbility: defaultInitiativeAbility,
          },
        });
      }
    },
  );
};
