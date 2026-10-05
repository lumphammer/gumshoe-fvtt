import { systemId } from "../constants";
import { createKeyedQueue } from "../functions/createKeyedQueue";
import { assertGame } from "../functions/isGame";
import { findHealthAbility, getHealth } from "../module/attacks/health";
import { getWoundState, type WoundState } from "../module/attacks/rules";
import {
  getWoundStatusTransition,
  type WoundStatusState,
} from "../module/attacks/woundStatus";
import { settings } from "../settings/settings";

const statusIconsPath = `systems/${systemId}/assets/icons/status`;

/**
 * Our own statuses. They're always available, so they can be used by hand
 * even when they aren't applied automatically. Dead is Foundry's own.
 */
const woundStatusEffects = [
  {
    id: "hurt",
    _id: "investigatorHurt",
    name: "investigator.WoundStateHurt",
    img: `${statusIconsPath}/hurt.svg`,
  },
  {
    id: "seriouslyWounded",
    _id: "investigSerWound",
    name: "investigator.WoundStateSeriouslyWounded",
    img: `${statusIconsPath}/seriously-wounded.svg`,
  },
];

function getStatusId(state: WoundStatusState): string {
  return state === "dead" ? CONFIG.specialStatusEffects.DEFEATED : state;
}

/**
 * Update options key for the wound states before a Health change, keyed by
 * the uuid of the updated document (one options object is shared by a whole
 * batch update).
 */
const woundStatesBeforeKey = "investigatorWoundStatesBefore";

type StashOptions = {
  [woundStatesBeforeKey]?: Record<string, WoundState>;
};

function stashWoundState(
  options: object,
  document: { uuid: string | null },
  actor: Actor,
): void {
  const health = getHealth(actor);
  if (health === null || document.uuid === null) return;
  const stashOptions = options as StashOptions;
  stashOptions[woundStatesBeforeKey] ??= {};
  stashOptions[woundStatesBeforeKey][document.uuid] = getWoundState(health);
}

const runExclusive = createKeyedQueue();

function updateWoundStatus(
  options: object,
  document: { uuid: string | null },
  actor: Actor,
): void {
  if (document.uuid === null || actor.uuid === null) return;
  const before = (options as StashOptions)[woundStatesBeforeKey]?.[
    document.uuid
  ];
  if (before === undefined) return;
  // the actor's uuid is unique even for unlinked tokens
  void runExclusive(actor.uuid, async () => {
    const health = getHealth(actor);
    if (health === null) return;
    const transition = getWoundStatusTransition(before, getWoundState(health));
    if (transition === null) return;
    for (const state of transition.remove) {
      await actor.toggleStatusEffect(getStatusId(state), { active: false });
    }
    if (transition.add !== null) {
      await actor.toggleStatusEffect(getStatusId(transition.add), {
        active: true,
        overlay: transition.add === "dead",
      });
    }
  });
}

/**
 * Register the Hurt and Seriously Wounded statuses, and (if the setting is on)
 * keep them and Dead in step with Health.
 *
 * Health usually lives in a general ability, synced to the actor's "health"
 * resource. A change to either ends up changing the ability, so we watch
 * that, and only watch the resource for actors without one. Before the
 * change we stash the old wound state in the update options; afterwards, on
 * the client which made the change (so it owns the actor), we swap statuses
 * if the state has changed.
 */
export function installWoundStatusHandler(): void {
  Hooks.once("init", () => {
    CONFIG.statusEffects.push(...woundStatusEffects);
  });

  Hooks.on("preUpdateItem", (item, changes, options) => {
    const actor = item.actor;
    if (
      !settings.useWoundStatusEffects.get() ||
      !actor ||
      (changes as { system?: { pool?: unknown } }).system?.pool === undefined ||
      findHealthAbility(actor)?.id !== item.id
    ) {
      return;
    }
    stashWoundState(options, item, actor);
  });

  Hooks.on("updateItem", (item, changes, options, userId) => {
    assertGame(game);
    if (game.userId !== userId || !item.actor) return;
    updateWoundStatus(options, item, item.actor);
  });

  Hooks.on("preUpdateActor", (actor, changes, options) => {
    const resources = (
      changes.system as { resources?: Record<string, { value?: unknown }> }
    )?.resources;
    if (
      !settings.useWoundStatusEffects.get() ||
      resources?.["health"]?.value === undefined ||
      findHealthAbility(actor) !== undefined
    ) {
      return;
    }
    stashWoundState(options, actor, actor);
  });

  Hooks.on("updateActor", (actor, changes, options, userId) => {
    assertGame(game);
    if (game.userId !== userId) return;
    updateWoundStatus(options, actor, actor);
  });
}
