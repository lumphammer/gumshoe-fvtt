import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  createSceneWithTokens,
  setSettings,
  updateAbility,
} from "./foundry.ts";

/**
 * Set up a fight, with damage application on: an investigator with a weapon
 * and 6 points in its ability, and cultists with Health 10, all on a scene.
 * Needs `test.use({ canvas: true })`.
 */
export async function setUpFight(
  page: Page,
  {
    weapon,
    cultists = 1,
  }: {
    /** the weapon's `system` data; it needs at least an ability */
    weapon: { ability: string } & Record<string, unknown>;
    cultists?: number;
  },
) {
  await setSettings(page, { useDamageApplication: true });
  const pcId = await createActor(page, { name: "Attacker", type: "pc" });
  await updateAbility(page, pcId, weapon.ability, { rating: 6, pool: 6 });
  const weaponId = await createOwnedItem(page, pcId, {
    name: "Weapon",
    type: "weapon",
    system: weapon,
  });
  const npcIds: string[] = [];
  for (let i = 1; i <= cultists; i++) {
    const npcId = await createActor(page, {
      name: `Cultist ${i}`,
      type: "npc",
    });
    await updateAbility(page, npcId, "Health", { rating: 10, pool: 10 });
    npcIds.push(npcId);
  }
  const [pcTokenId, ...npcTokenIds] = await createSceneWithTokens(page, [
    pcId,
    ...npcIds,
  ]);
  return { pcId, weaponId, npcIds, pcTokenId, npcTokenIds };
}

/**
 * The Health of a token's actor. NPC tokens aren't linked to their actor, so
 * damage goes to the token's own copy.
 */
export async function getTokenHealth(page: Page, tokenId: string) {
  return page.evaluate(
    (tokenId) =>
      canvas!.scene!.tokens.get(tokenId)!.actor!.items.getName("Health")!.system
        .pool as number,
    tokenId,
  );
}

/** A point blank knife, which uses Scuffling. */
export const knife = {
  ability: "Scuffling",
  usesAmmo: false,
  isPointBlank: true,
  pointBlankDamage: 0,
};

/**
 * A selective-fire rifle with only a close range, which uses Firearms. (With
 * only point blank, it would count as a melee weapon.)
 */
export const rifle = {
  ability: "Firearms",
  usesAmmo: true,
  ammo: { min: 0, max: 30, value: 30 },
  isGunfire: true,
  fireModes: "selective",
  isPointBlank: false,
  isCloseRange: true,
  closeRangeDamage: 0,
};
