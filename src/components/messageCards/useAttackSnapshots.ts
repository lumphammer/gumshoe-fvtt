// Hooks for attack cards, which read the targets' and the attacker's actors
// through snapshots. They aren't compiled, so the live lookups in them (which
// token a target is, which weapon made the attack) run on every render.

import { useActorListSnapshot } from "../../hooks/useActorsSnapshot";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSnapshot } from "../../hooks/useSnapshot";
import type { AttackMessage } from "../../module/attacks/attackTargets";
import { getTargetActor } from "../../module/attacks/attackTargets";
import type {
  ResolveOptions,
  TargetActorInfo,
} from "../../module/attacks/resolveAttackTarget";
import { getTargetActorInfoIn } from "../../module/attacks/targetActorInfo";
import { canUser } from "../../module/permissions";
import type { AttackTargetData } from "../../module/attacks/types";
import { getTokenActorsCounter } from "../../module/snapshots/gameStores";
import type { WalkingFireOptions } from "../../module/attacks/walkingFire";
import {
  getAttackWeapon,
  getWalkingFirePaymentsIn,
} from "../../module/attacks/walkingFire";

/** What an attack card shows of a target's actor */
export type TargetView = {
  /** false if the token, or its actor, has gone */
  exists: boolean;
  name: string | null;
  info: TargetActorInfo;
  /** whether this user may see the target's Health (Observer or better) */
  canSeeHealth: boolean;
};

/** Each target's actor, as the card shows it, by target id */
export function useTargetViews(
  targets: readonly AttackTargetData[],
): Readonly<Record<string, TargetView>> {
  // which actor a target's token has can change without the actor changing
  useSnapshot(getTokenActorsCounter());
  const actors = targets.map(
    (target) => getTargetActor(target) as Actor.Implementation | null,
  );
  return useActorListSnapshot(actors, (snapshots) =>
    Object.fromEntries(
      targets.map((target, i): [string, TargetView] => {
        const snapshot = snapshots[i] ?? null;
        return [
          target.id,
          {
            exists: snapshot !== null,
            name: snapshot?.name ?? null,
            info: getTargetActorInfoIn(snapshot),
            // (the live actor's, but a selector runs again on every change to
            // it, ownership included)
            canSeeHealth: canUser(actors[i], "OBSERVER"),
          },
        ];
      }),
    ),
  );
}

/** The settings which change how attacks resolve */
export function useResolveOptions(): ResolveOptions {
  return useSettings((s) => ({
    useCriticalHits: s.useCriticalHits,
    useGunfireOnHumans: s.useGunfireOnHumans,
    useLethality: s.useLethalityAndAutofire,
  }));
}

/**
 * How the attacker can pay to walk their fire, from their pools (see
 * `getWalkingFirePaymentsIn`), or null if they can't
 */
export function useWalkingFireOptions(
  msg: AttackMessage,
): WalkingFireOptions | null {
  const weapon = getAttackWeapon(msg);
  const spendNames = useSettings((s) => s.walkingFireSpendAbilities);
  return useActorSnapshot(weapon?.actor ?? null, (actor) => {
    if (actor === null || weapon === null) return null;
    const own = actor.items.find((item) => item._id === weapon.id);
    const abilityName = (own?.system as { ability?: string } | undefined)
      ?.ability;
    if (abilityName === undefined) return null;
    return getWalkingFirePaymentsIn(actor.items, abilityName, spendNames);
  });
}
