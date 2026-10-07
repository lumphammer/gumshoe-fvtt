import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  createPlayer,
  createSceneWithTokens,
  expect,
  forceDice,
  giveOwnership,
  lastChatMessage,
  openSheet,
  setSettings,
  targetTokens,
  test,
  updateAbility,
} from "./foundry.ts";

test.use({ canvas: true });

/**
 * An investigator with Scuffling 4 and a knife (no ammo, point blank only),
 * and a cultist with Health 10, both on a scene.
 */
async function setUpFight(page: Page) {
  await setSettings(page, { useDamageApplication: true });
  const pcId = await createActor(page, { name: "Attacker", type: "pc" });
  await updateAbility(page, pcId, "Scuffling", { rating: 4, pool: 4 });
  const knifeId = await createOwnedItem(page, pcId, {
    name: "Knife",
    type: "weapon",
    system: {
      ability: "Scuffling",
      usesAmmo: false,
      isPointBlank: true,
      pointBlankDamage: 0,
    },
  });
  const npcId = await createActor(page, { name: "Cultist", type: "npc" });
  await updateAbility(page, npcId, "Health", { rating: 10, pool: 10 });
  const [pcTokenId, npcTokenId] = await createSceneWithTokens(page, [
    pcId,
    npcId,
  ]);
  return { pcId, knifeId, npcId, pcTokenId, npcTokenId };
}

/**
 * The Health of a token's actor. NPC tokens aren't linked to their actor, so
 * damage goes to the token's own copy.
 */
async function getTokenHealth(page: Page, tokenId: string) {
  return page.evaluate(
    (tokenId) =>
      canvas!.scene!.tokens.get(tokenId)!.actor!.items.getName("Health")!.system
        .pool as number,
    tokenId,
  );
}

test("the GM attacks a target, applies the damage, and undoes it", async ({
  page,
}) => {
  const { pcId, knifeId, npcTokenId } = await setUpFight(page);
  await targetTokens(page, [npcTokenId]);
  await forceDice(page, 6);

  const weaponSheet = await openSheet(page, `Actor.${pcId}.Item.${knifeId}`);
  await weaponSheet.locator("label", { hasText: /^2$/ }).click();
  await weaponSheet.getByRole("button", { name: "Attack with Knife" }).click();

  const card = lastChatMessage(page);
  await expect(card).toContainText("Hit roll: 6+2");
  await expect(card).toContainText("Cultist");
  await expect(card).toContainText("10 → 4");
  await expect
    .poll(() =>
      page.evaluate(
        (pcId) =>
          game.actors.get(pcId)!.items.getName("Scuffling")!.system
            .pool as number,
        pcId,
      ),
    )
    .toBe(2);

  await card.getByRole("button", { name: "Apply damage" }).click();
  await expect.poll(() => getTokenHealth(page, npcTokenId)).toBe(4);
  await expect(card).toContainText("Applied");

  await card.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => getTokenHealth(page, npcTokenId)).toBe(10);
  await expect(
    card.getByRole("button", { name: "Apply damage" }),
  ).toBeVisible();
});

test("a player's damage to a token they don't own goes through the GM", async ({
  page,
  joinAs,
}) => {
  const { pcId, knifeId, npcTokenId } = await setUpFight(page);
  const playerId = await createPlayer(page, "Player One");
  await giveOwnership(page, pcId, playerId);

  const player = await joinAs("Player One");
  await targetTokens(player, [npcTokenId]);
  await forceDice(player, 6);
  const weaponSheet = await openSheet(player, `Actor.${pcId}.Item.${knifeId}`);
  await weaponSheet.getByRole("button", { name: "Attack with Knife" }).click();

  const card = lastChatMessage(player);
  await expect(card).toContainText("Cultist");
  await card.getByRole("button", { name: "Apply damage" }).click();
  await expect.poll(() => getTokenHealth(page, npcTokenId)).toBe(4);
  await expect(card).toContainText("Applied");
  // the GM sees the same
  await expect(lastChatMessage(page)).toContainText("Applied");

  await card.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => getTokenHealth(page, npcTokenId)).toBe(10);
});
