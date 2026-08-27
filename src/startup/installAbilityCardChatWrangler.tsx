import { ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AbilityNegateOrWallopMwCard } from "../components/messageCards/AbilityNegateOrWallopMwCard";
import { AbilityTestCard } from "../components/messageCards/AbilityTestCard";
import { AbilityTestMwCard } from "../components/messageCards/AbilityTestMwCard";
import { AttackCard } from "../components/messageCards/AttackCard";
import { BrokenCard } from "../components/messageCards/BrokenCard";
import { PushCard } from "../components/messageCards/PushCard";
import { isAbilityCardMode } from "../components/messageCards/types";
import * as constants from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { isAbilityItem } from "../module/items/exports";
import { MWDifficulty } from "../types";

export const installAbilityCardChatWrangler = () => {
  Hooks.on(
    "renderChatMessageHTML",
    (chatMessage: ChatMessage, html: HTMLElement, options: any) => {
      assertGame(game);
      const el: HTMLElement | null = html.querySelector(
        `.${constants.abilityChatMessageClassName}`,
      );
      if (el === null) {
        return;
      }
      // this seems clunky but I can't see a way to pass arbitrary data through
      // rolls or chat messages. at least this way the filth is confined to this
      // handler - we grab the actor and ability here and pass it on to the
      // component, which can just think in terms of the data.
      const abilityId = el.getAttribute(constants.htmlDataItemId);
      const actorId = el.getAttribute(constants.htmlDataActorId);
      const tokenId = el.getAttribute(constants.htmlDataTokenId);
      const mode = el.getAttribute(constants.htmlDataMode);
      const weaponId = el.getAttribute(constants.htmlDataWeaponId);
      const rangeName = el.getAttribute(constants.htmlDataRange);
      const name = el.getAttribute(constants.htmlDataName);
      const imageUrl = el.getAttribute(constants.htmlDataImageUrl);

      // chat message content is immutable, so anything we can't resolve here is
      // unfixable - render a static stand-in rather than leaving an empty div
      const renderBroken = (reason: string) => {
        createRoot(el).render(
          <BrokenCard name={name} imageUrl={imageUrl} reason={reason} />,
        );
      };

      if (mode === null || !isAbilityCardMode(mode)) {
        systemLogger.error(
          "Ability test chat message found without a valid " +
            `'${constants.htmlDataMode}' attribute. ` +
            '(Valid values are "test", "spend", "combat", "push"',
          el,
        );
        renderBroken("BrokenCardInvalidMode");
        return;
      }

      // foundry doesn't seem to have a canonical way to just grab an item
      // regardless of where it is (world, actor, token, compendium etc.)
      // try the token first, so that unlinked tokens get their own actor's
      // data, but fall back to the world actor - either one can be a dead end
      // (the token may be on a scene we're not looking at, or deleted
      // entirely) so it's worth trying both before we give up.
      const actor =
        (tokenId ? canvas?.tokens?.get(tokenId)?.actor : undefined) ??
        (actorId ? game.actors?.get(actorId) : undefined);

      if (actor === undefined || actor === null) {
        if (!actorId && !tokenId) {
          systemLogger.error(
            `Missing or invalid '${constants.htmlDataActorId}' and ` +
              `'${constants.htmlDataTokenId}' attributes.`,
            el,
          );
          renderBroken("BrokenCardMissingActorId");
        } else {
          systemLogger.error(
            `Could not find actor with id ${actorId} or token with id ${tokenId}`,
            el,
          );
          renderBroken("BrokenCardMissingActor");
        }
        return;
      }

      const ability = abilityId ? actor.items.get(abilityId) : undefined;

      let content: ReactNode;
      if (mode === constants.htmlDataModeAttack) {
        const weapon = weaponId ? actor.items.get(weaponId) : undefined;
        if (weapon === undefined) {
          systemLogger.error(`Could not find weapon with id ${weaponId}`, el);
          renderBroken("BrokenCardMissingItem");
          return;
        }
        content = (
          <AttackCard
            msg={chatMessage}
            weapon={weapon}
            rangeName={rangeName}
            imageUrl={imageUrl}
            name={name}
          />
        );
      } else if (!isAbilityItem(ability)) {
        systemLogger.error(`Could not find ability with id ${abilityId}`, el);
        renderBroken("BrokenCardMissingItem");
        return;
      } else if (mode === constants.htmlDataModeMwTest) {
        // MW TEST
        const difficultyAttr = el.getAttribute(constants.htmlDataMwDifficulty);
        const difficulty: MWDifficulty =
          difficultyAttr === "easy" ? "easy" : Number(difficultyAttr ?? 0);
        const boonLevy = Number(
          el.getAttribute(constants.htmlDataMwBoonLevy) ?? 0,
        );
        const reRoll = el.getAttribute(constants.htmlDataMwReRoll);
        const pool = Number(el.getAttribute(constants.htmlDataMwPool));
        content = (
          <AbilityTestMwCard
            msg={chatMessage}
            ability={ability}
            difficulty={difficulty}
            boonLevy={boonLevy}
            reRoll={reRoll ? Number(reRoll) : undefined}
            pool={pool}
            name={name}
          />
        );
      } else if (
        mode === constants.htmlDataModeMwWallop ||
        mode === constants.htmlDataModeMwNegate
      ) {
        // MW NEGATE OR WALLOP
        const pool = Number(el.getAttribute(constants.htmlDataMwPool));
        content = (
          <AbilityNegateOrWallopMwCard
            msg={chatMessage}
            ability={ability}
            pool={pool}
            mode={mode}
            name={name}
          />
        );
      } else if (mode === constants.htmlDataModePush) {
        content = (
          <PushCard
            msg={chatMessage}
            ability={ability}
            mode={mode}
            imageUrl={imageUrl}
            name={name}
          />
        );
      } else {
        // REGULAR TEST /SPEND
        content = (
          <StrictMode>
            <AbilityTestCard
              msg={chatMessage}
              ability={ability}
              mode={mode}
              imageUrl={imageUrl}
              name={name}
            />
          </StrictMode>
        );
      }
      createRoot(el).render(content);
    },
  );
};
