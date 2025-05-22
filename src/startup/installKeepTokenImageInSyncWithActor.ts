import { getTokenizer } from "../functions/getTokenizer";
import { assertGame } from "../functions/utilities";

export function installKeepTokenImageInSyncWithActor() {
  /*
   * When an actor image is updated, if the prototype token is using the same
   * image as the old actor image, or it's the "cowled figure" image, then
   * update the prototype token to use the new image.
   */
  Hooks.on(
    "preUpdateActor",
    function keepTokenImageInSyncWithActor(
      actor: Actor,
      update: any,
      options: any,
      userId: string,
    ) {
      assertGame(game);
      // if tokenizer is installed, it updates the token image and we don't want
      // to break that - see https://github.com/n3dst4/gumshoe-fvtt/issues/706
      const { tokenizerIsActive } = getTokenizer();

      if (
        tokenizerIsActive ||
        game.userId !== userId ||
        update.img === undefined
      ) {
        return;
      }

      const token = actor.prototypeToken;
      if (["icons/svg/cowled.svg", actor.img].includes(token.texture.src)) {
        void token.update({ texture: { src: update.img } }, {});
      }
    },
  ); //
}
