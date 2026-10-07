import { getTokenHealth, knife, setUpFight } from "./fight.ts";
import {
  createActor,
  createPlayer,
  expect,
  forceDice,
  giveOwnership,
  lastChatMessage,
  openSheet,
  reloadGame,
  targetTokens,
  test,
} from "./foundry.ts";

// What players can and can't do. Set permissions before a player joins:
// changing them while a player without a canvas is logged in trips over a
// Foundry bug (Actor#_onUpdate calls canvas.tokens.cycleTokens regardless).

test.describe("attack cards", () => {
  test.use({ canvas: true });

  test("a player sees whether they hit, but a target's Health only with Observer permission", async ({
    page,
    joinAs,
  }) => {
    const {
      pcId,
      weaponId,
      npcIds: [cultistId],
      npcTokenIds: [cultist],
    } = await setUpFight(page, { weapon: knife, cultists: 1 });
    const playerId = await createPlayer(page, "Peeker");
    await giveOwnership(page, pcId, playerId);

    const player = await joinAs("Peeker");
    await targetTokens(player, [cultist]);
    await forceDice(player, 6);
    const sheet = await openSheet(player, `Actor.${pcId}.Item.${weaponId}`);
    await sheet.getByRole("button", { name: "Attack with Weapon" }).click();

    const card = lastChatMessage(player);
    await expect(card).toContainText("Hit Threshold3: Hit");
    // the wound state, but not the numbers
    await expect(card).toContainText("Health(OK)");
    await expect(card).not.toContainText("10 → 4");
    // the GM sees them
    await expect(lastChatMessage(page)).toContainText("10 → 4");

    // with Observer permission (and a fresh look at the card), they show
    await giveOwnership(page, cultistId, playerId, "OBSERVER");
    await reloadGame(player);
    await expect(lastChatMessage(player)).toContainText("10 → 4");
    // nothing changed on the way
    expect(await getTokenHealth(page, cultist)).toBe(10);
  });

  test("a player can't change someone else's attack card", async ({
    page,
    joinAs,
  }) => {
    const {
      pcId,
      weaponId,
      npcTokenIds: [cultist],
    } = await setUpFight(page, { weapon: knife });
    await createPlayer(page, "Meddler");
    // the GM attacks
    await targetTokens(page, [cultist]);
    await forceDice(page, 6);
    const sheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
    await sheet.getByRole("button", { name: "Attack with Weapon" }).click();
    await expect(lastChatMessage(page)).toContainText("Cultist 1");
    const messageId = await page.evaluate(
      () => game.messages.contents.at(-1)!.id,
    );

    const player = await joinAs("Meddler");
    const card = lastChatMessage(player);
    await expect(card).toContainText("Cultist 1");
    // no controls for them
    await expect(
      card.getByRole("button", { name: "Apply damage" }),
    ).toHaveCount(0);
    await expect(card.getByLabel("Cover for Cultist 1")).toHaveCount(0);

    // and the GM's client ignores them if they ask anyway
    await player.evaluate(
      ({ messageId, targetId }) => {
        game.socket.emit("system.investigator", {
          type: "editAttack",
          messageId,
          edit: { kind: "applyDamage", targetId, undo: false },
        });
        game.socket.emit("system.investigator", {
          type: "editAttack",
          messageId,
          edit: { kind: "updateTarget", targetId, update: { cover: "full" } },
        });
      },
      {
        messageId,
        targetId: await page.evaluate(
          () =>
            (
              game.messages.contents.at(-1)!.system as unknown as {
                targets: { id: string }[];
              }
            ).targets[0].id,
        ),
      },
    );
    await page.waitForTimeout(2000);
    expect(await getTokenHealth(page, cultist)).toBe(10);
    expect(
      await page.evaluate(
        () =>
          (
            game.messages.contents.at(-1)!.system as unknown as {
              targets: { cover: string; applied: unknown }[];
            }
          ).targets[0],
      ),
    ).toMatchObject({ cover: "partial", applied: null });
  });
});

test("only the GM can open the system settings", async ({ page, joinAs }) => {
  await createPlayer(page, "Tinkerer");
  const player = await joinAs("Tinkerer");
  for (const [who, expected] of [
    [page, 1],
    [player, 0],
  ] as const) {
    await who.evaluate(async () => {
      await new foundry.applications.settings.SettingsConfig().render({
        force: true,
      });
    });
    const settingsWindow = who.locator("#settings-config");
    await expect(settingsWindow).toBeVisible();
    await expect(
      settingsWindow.locator(
        '[data-key="investigator.investigatorSettingsMenu"]',
      ),
    ).toHaveCount(expected);
  }
});

test("players don't see an NPC's GM notes", async ({ page, joinAs }) => {
  const npcId = await createActor(page, {
    name: "Mysterious Stranger",
    type: "npc",
    system: { gmNotes: "<p>Secretly a ghoul</p>" },
  });
  const playerId = await createPlayer(page, "Snoop");
  // with Observer, they get the full NPC sheet (with Limited, a simple one)
  await giveOwnership(page, npcId, playerId, "OBSERVER");

  const player = await joinAs("Snoop");
  const sheet = await openSheet(player, `Actor.${npcId}`);
  // wait for the tabs, so checking one isn't there means something
  const tabs = sheet.locator(".tab-strip > label");
  await expect(tabs.filter({ hasText: /^Notes$/ })).toBeVisible();
  await expect(tabs).toHaveText(["Play", "Edit", "Notes"]);
  await expect(sheet).not.toContainText("Secretly a ghoul");
});

test("with Limited permission, players see a character's name and picture, not their details", async ({
  page,
  joinAs,
}) => {
  const pcId = await createActor(page, {
    name: "Dr Ellery",
    type: "pc",
    system: { notes: "<p>Afraid of the dark</p>" },
  });
  // give them an occupation of their own
  await page.evaluate(async (id) => {
    const actor = game.actors.get(id)!;
    const occupation = actor.items.find((i) => i.type === "personalDetail")!;
    await occupation.update({ name: "Antiquarian" });
  }, pcId);
  const npcId = await createActor(page, {
    name: "The Caretaker",
    type: "npc",
    system: {
      notes: "<p>Knows more than he says</p>",
      gmNotes: "<p>Secretly a ghoul</p>",
    },
  });
  const playerId = await createPlayer(page, "Neighbour");
  await giveOwnership(page, pcId, playerId, "LIMITED");
  await giveOwnership(page, npcId, playerId, "LIMITED");

  const player = await joinAs("Neighbour");
  const pcSheet = await openSheet(player, `Actor.${pcId}`);
  await expect(pcSheet).toContainText("Dr Ellery");
  await expect(pcSheet).toContainText("Antiquarian");
  // nothing else: no tabs, abilities or notes
  await expect(pcSheet.locator(".tab-strip")).toHaveCount(0);
  await expect(pcSheet).not.toContainText("Athletics");
  await expect(pcSheet).not.toContainText("Afraid of the dark");
  // and the name can't be edited
  await expect(pcSheet.locator("[contenteditable=true]")).toHaveCount(0);

  // NPCs show their (player-facing) notes, but not the GM's
  const npcSheet = await openSheet(player, `Actor.${npcId}`);
  await expect(npcSheet).toContainText("Knows more than he says");
  await expect(npcSheet).not.toContainText("Secretly a ghoul");
});
