import { createKeyedQueue } from "../functions/createKeyedQueue";
import { getTranslated } from "../functions/getTranslated";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { isPCActor } from "../module/actors/pc";
import {
  getStabilityState,
  getStabilityStatusTransition,
  type StabilityState,
} from "../module/stability/states";
import { settings } from "../settings/settings";

/**
 * Our Stability statuses (Fall of DELTA GREEN, p. 113). They're always
 * available, so they can be used by hand even when they aren't applied
 * automatically. Foundry's own icons, for now.
 */
const stabilityStatusEffects = [
  {
    id: "shaken",
    _id: "investigatShaken",
    name: "investigator.StabilityStateShaken",
    img: "icons/svg/daze.svg",
  },
  {
    id: "shattered",
    _id: "investShattered1",
    name: "investigator.StabilityStateShattered",
    img: "icons/svg/terror.svg",
  },
  {
    id: "gone",
    _id: "investigatorGone",
    name: "investigator.StabilityStateGone",
    img: "icons/svg/statue.svg",
  },
];

/**
 * Update options key for the Stability states before a change, keyed by the
 * item's uuid (one options object is shared by a whole batch update).
 */
const statesBeforeKey = "investigatorStabilityStatesBefore";

type StashOptions = {
  [statesBeforeKey]?: Record<string, StabilityState>;
};

const runExclusive = createKeyedQueue();

/**
 * Register the Shaken, Shattered and Gone statuses, and (if Stability states
 * are on) keep them in step with PCs' Stability pools: before a change to the
 * pool we stash the old state in the update options; afterwards, on the
 * client which made the change, we swap statuses if the state has changed.
 * See `installWoundStatusHandler`, which does the same for Health.
 */
export function installStabilityStatusHandler(): void {
  Hooks.once("init", () => {
    CONFIG.statusEffects.push(...stabilityStatusEffects);
  });

  Hooks.on("preUpdateItem", (item, changes, options) => {
    const actor = item.actor;
    if (
      !settings.useStabilityStates.get() ||
      !isPCActor(actor) ||
      item.uuid === null ||
      (changes as { system?: { pool?: unknown } }).system?.pool === undefined ||
      actor.system.getBondStabilityAbility()?.id !== item.id
    ) {
      return;
    }
    const stashOptions = options as StashOptions;
    stashOptions[statesBeforeKey] ??= {};
    stashOptions[statesBeforeKey][item.uuid] = getStabilityState(
      (item.system as { pool: number }).pool,
    );
  });

  Hooks.on("updateItem", (item, changes, options, userId) => {
    assertGame(game);
    const actor = item.actor;
    if (game.userId !== userId || !isPCActor(actor) || item.uuid === null) {
      return;
    }
    const before = (options as StashOptions)[statesBeforeKey]?.[item.uuid];
    if (before === undefined || actor.uuid === null) return;
    // the actor's uuid is unique even for unlinked tokens
    runExclusive(actor.uuid, async () => {
      const stability = actor.system.getBondStabilityAbility();
      if (stability === undefined) return;
      const transition = getStabilityStatusTransition(
        before,
        getStabilityState(stability.system.pool),
      );
      if (transition === null) return;
      for (const state of transition.remove) {
        await actor.toggleStatusEffect(state, { active: false });
      }
      if (transition.add !== null) {
        await actor.toggleStatusEffect(transition.add, { active: true });
      }
    }).catch((error: unknown) => {
      systemLogger.error("Failed to update Stability status", error);
      ui.notifications?.error(
        getTranslated("StabilityStatusUpdateFailed", {
          ActorName: actor.name ?? "",
        }),
      );
    });
  });
}
