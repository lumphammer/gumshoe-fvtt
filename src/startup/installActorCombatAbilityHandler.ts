import { assertGame } from "../functions/isGame";
import { isNullOrEmptyString } from "../functions/utilities";
import { isActiveCharacterActor } from "../module/actors/types";
import { settings } from "../settings/settings";

export const installActorCombatAbilityHandler = () => {
  Hooks.on(
    "preCreateActor",
    (
      actor: Actor.Implementation,
      createData: Actor.CreateData,
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
