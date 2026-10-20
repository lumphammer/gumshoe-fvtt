import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { isPCActor } from "../module/actors/pc";

type RatingChanges = { system?: { rating?: unknown } };

/**
 * Keep a PC's Sanity rating within its cap (see
 * docs/stability-settings-plan.md). However the rating is changed (the
 * sheet, a script), it can't go above the cap. When the ability which caps
 * Sanity goes up, Sanity comes down to match, along with its pool if that's
 * above the new cap.
 */
export function installSanityCapHandler(): void {
  Hooks.on("preUpdateItem", (item, changes) => {
    const actor = item.actor;
    const system = (changes as RatingChanges).system;
    if (
      !isPCActor(actor) ||
      typeof system?.rating !== "number" ||
      actor.system.getSanityAbility()?.id !== item.id
    ) {
      return;
    }
    const cap = actor.system.getSanityCap();
    if (cap !== null && system.rating > cap) {
      system.rating = cap;
    }
  });

  Hooks.on("updateItem", (item, changes, _options, userId) => {
    assertGame(game);
    const actor = item.actor;
    if (
      game.userId !== userId ||
      !isPCActor(actor) ||
      (changes as RatingChanges).system?.rating === undefined ||
      actor.system.getSanityCapAbility()?.id !== item.id
    ) {
      return;
    }
    const sanity = actor.system.getSanityAbility();
    const cap = actor.system.getSanityCap();
    if (sanity === undefined || cap === null || sanity.system.rating <= cap) {
      return;
    }
    // the rules, not a choice, so no asking
    sanity
      .update({
        system: { rating: cap, pool: Math.min(sanity.system.pool, cap) },
      })
      .catch((error: unknown) => {
        systemLogger.error("Failed to cap Sanity", error);
        ui.notifications?.error(
          getTranslated("SanityCapFailed", {
            ActorName: actor.name ?? "",
            AbilityName: sanity.name ?? "",
          }),
        );
      });
  });
}
