import { getTokenHealth, knife, setUpFight } from "./fight.ts";
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

test("the GM attacks a target, applies the damage, and undoes it", async ({
  page,
}) => {
  const {
    pcId,
    weaponId,
    npcTokenIds: [npcTokenId],
  } = await setUpFight(page, { weapon: knife });
  await targetTokens(page, [npcTokenId]);
  await forceDice(page, 6);

  const weaponSheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  await weaponSheet.locator("label", { hasText: /^2$/ }).click();
  await weaponSheet.getByRole("button", { name: "Attack with Weapon" }).click();

  const card = lastChatMessage(page);
  await expect(card).toContainText("Hit roll: 6+2");
  await expect(card).toContainText("Cultist 1");
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
    .toBe(4);

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
  const {
    pcId,
    weaponId,
    npcTokenIds: [npcTokenId],
  } = await setUpFight(page, { weapon: knife });
  const playerId = await createPlayer(page, "Player One");
  await giveOwnership(page, pcId, playerId);

  const player = await joinAs("Player One");
  await targetTokens(player, [npcTokenId]);
  await forceDice(player, 6);
  const weaponSheet = await openSheet(player, `Actor.${pcId}.Item.${weaponId}`);
  await weaponSheet.getByRole("button", { name: "Attack with Weapon" }).click();

  const card = lastChatMessage(player);
  await expect(card).toContainText("Cultist 1");
  await card.getByRole("button", { name: "Apply damage" }).click();
  await expect.poll(() => getTokenHealth(page, npcTokenId)).toBe(4);
  await expect(card).toContainText("Applied");
  // the GM sees the same
  await expect(lastChatMessage(page)).toContainText("Applied");

  await card.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => getTokenHealth(page, npcTokenId)).toBe(10);
});

test("an NPC's combat and damage bonuses add to its attacks", async ({
  page,
}) => {
  await setSettings(page, {
    useDamageApplication: true,
    useNpcCombatBonuses: true,
  });
  const npcId = await createActor(page, {
    name: "Brute",
    type: "npc",
    system: { combatBonus: 1, damageBonus: 2 },
  });
  await updateAbility(page, npcId, "Scuffling", { rating: 6, pool: 6 });
  const clubId = await createOwnedItem(page, npcId, {
    name: "Club",
    type: "weapon",
    system: knife,
  });
  const pcId = await createActor(page, {
    name: "Victim",
    type: "pc",
    // a linked token, so damage goes to the actor itself
    prototypeToken: { actorLink: true },
  });
  await updateAbility(page, pcId, "Health", { rating: 10, pool: 10 });
  const [, pcTokenId] = await createSceneWithTokens(page, [npcId, pcId]);
  await targetTokens(page, [pcTokenId]);
  await forceDice(page, 6);

  const sheet = await openSheet(page, `Actor.${npcId}.Item.${clubId}`);
  await sheet.getByRole("button", { name: "Attack with Club" }).click();

  const card = lastChatMessage(page);
  // 6 + spend 0 + NPC's 1 + the ability's 0
  await expect(card).toContainText("Hit roll: 6+0+1+0 =7");
  // 6 + damage 0 + range 0 + NPC's 2 + the ability's 0
  await expect(card).toContainText("Damage: 6+0+0+2+0 =8");
  await card.getByRole("button", { name: "Apply damage" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          game.actors.get(id)!.items.getName("Health")!.system.pool as number,
        pcId,
      ),
    )
    .toBe(2);
});
