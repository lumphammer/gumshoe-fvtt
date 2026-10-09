import { rifle, setUpFight } from "./fight.ts";
import {
  createPlayer,
  expect,
  forceDice,
  giveOwnership,
  lastChatMessage,
  openSheet,
  setSettings,
  targetTokens,
  test,
} from "./foundry.ts";

test.use({ canvas: true });

// Card edits are each a read-modify-write of the whole `system`, so when two
// clients wrote a card at once, one edit could be lost (about one run in
// three of this test). Now they all go through the GM's client, one at a
// time.
test("two people editing one attack card at once", async ({ page, joinAs }) => {
  await setSettings(page, { useLethalityAndAutofire: true });
  const {
    pcId,
    weaponId,
    npcTokenIds: [first, second],
  } = await setUpFight(page, { weapon: rifle, cultists: 2 });
  const playerId = await createPlayer(page, "Player Four");
  await giveOwnership(page, pcId, playerId);

  const player = await joinAs("Player Four");
  await targetTokens(player, [first, second]);
  await forceDice(player, 6);
  const sheet = await openSheet(player, `Actor.${pcId}.Item.${weaponId}`);
  await sheet.locator("label", { hasText: /^Full-auto$/ }).click();
  await sheet
    .locator("label", { hasText: /^Firearms$/ })
    .locator("xpath=following-sibling::div[1]")
    .locator("label", { hasText: /^5$/ })
    .click();
  await sheet.getByRole("button", { name: "Fire Weapon" }).click();

  const playerCard = lastChatMessage(player);
  const gmCard = lastChatMessage(page);
  await expect(playerCard.getByLabel("Cover for Cultist 1")).toBeVisible();
  await expect(gmCard.getByLabel("Cover for Cultist 2")).toBeVisible();

  // the player changes the first target's cover, and the GM the second's, at
  // the same moment (both pages wait for the same time, then change it)
  const at = Date.now() + 1000;
  const changeCoverAt = async (
    who: typeof page,
    tokenName: string,
    cover: string,
  ) =>
    who.evaluate(
      async ({ at, label, cover }) => {
        while (Date.now() < at) await new Promise((r) => setTimeout(r, 1));
        // find it now, not before waiting: if the other change got in first,
        // the card has re-rendered, and the old select is gone
        const select = Array.from(
          document.querySelectorAll<HTMLSelectElement>(
            `#chat select[aria-label="${label}"]`,
          ),
        ).at(-1)!;
        // set it the way React notices: through the prototype's setter
        Reflect.set(HTMLSelectElement.prototype, "value", cover, select);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { at, label: `Cover for ${tokenName}`, cover },
    );
  await Promise.all([
    changeCoverAt(player, "Cultist 1", "exposed"),
    changeCoverAt(page, "Cultist 2", "full"),
  ]);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          game.messages.contents.at(-1)!.system as unknown as {
            targets: { cover: string }[];
          }
        ).targets.map((t) => t.cover),
      ),
    )
    .toEqual(["exposed", "full"]);
});
