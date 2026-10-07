import { getTokenHealth, knife, setUpFight } from "./fight.ts";
import {
  createPlayer,
  expect,
  forceDice,
  giveOwnership,
  lastChatMessage,
  openSheet,
  targetTokens,
  test,
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
