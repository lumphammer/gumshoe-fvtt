import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  forceDice,
  lastChatMessage,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

const contactsOn = { useNetworkContacts: true, networkAbility: "Network" };

function getPools(page: Page, actorId: string) {
  return page.evaluate((actorId) => {
    const actor = game.actors.get(actorId)!;
    const pool = (name: string) =>
      (actor.items.getName(name)?.system as unknown as { pool: number })?.pool;
    return { network: pool("Network"), fred: pool("Fred") };
  }, actorId);
}

test("a contact gets Network points, which they spend and never refresh", async ({
  page,
}) => {
  await setSettings(page, contactsOn);
  const actorId = await createActor(page, { name: "Handler", type: "pc" });
  await createOwnedItem(page, actorId, {
    name: "Network",
    type: "generalAbility",
    system: { rating: 5, pool: 5 },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.locator(".tab-strip > label", { hasText: "Contacts" }).click();
  await expect(sheet.getByTestId("network-summary")).toHaveText(
    "Network: 5 of 5 left, 0 with contacts",
  );

  // a new contact opens their sheet
  await sheet.getByRole("button", { name: "New contact" }).click();
  const getContactId = () =>
    page.evaluate(
      (actorId) =>
        game.actors
          .get(actorId)!
          .items.find((item) => item.type === "networkContact")?.id ?? null,
      actorId,
    );
  await expect.poll(getContactId).not.toBeNull();
  const contactId = (await getContactId())!;
  const contactSheet = await openSheet(
    page,
    `Actor.${actorId}.Item.${contactId}`,
  );
  await contactSheet.getByLabel("Name", { exact: true }).fill("Fred");
  await contactSheet.getByLabel("Location").fill("Bangkok");
  await expect
    .poll(() =>
      page.evaluate(
        ({ actorId, contactId }) => {
          const item = game.actors.get(actorId)!.items.get(contactId)!;
          return [
            item.name,
            (item.system as unknown as { location: string }).location,
          ];
        },
        { actorId, contactId },
      ),
    )
    .toEqual(["Fred", "Bangkok"]);

  // with nothing in his pool, there's nothing to spend
  await expect(contactSheet.getByTestId("tap-contact-1")).toBeDisabled();
  await expect(contactSheet.getByTestId("test-contact")).toBeDisabled();

  // give him 3 of the 5
  const giveRow = contactSheet.getByTestId("give-row");
  await expect(giveRow.getByRole("radio", { name: "5" })).toBeEnabled();
  await expect(giveRow.getByRole("radio", { name: "6" })).toBeDisabled();
  await giveRow.getByText("3", { exact: true }).click();
  await contactSheet.getByTestId("give-network-points").click();
  await expect
    .poll(() => getPools(page, actorId))
    .toEqual({
      network: 2,
      fred: 3,
    });
  const giveCard = lastChatMessage(page).getByTestId("network-contact-card");
  await expect(giveCard).toContainText("Fred (Bangkok)");
  await expect(giveCard.getByTestId("network-contact-action")).toHaveText(
    "Given 3 Network points",
  );
  await expect(
    giveCard.getByTestId("network-contact-network-change"),
  ).toHaveText("Network: 5 → 2");

  // tap him for information twice
  await contactSheet.getByTestId("tap-contact-1").click();
  await expect
    .poll(() => getPools(page, actorId))
    .toEqual({
      network: 2,
      fred: 2,
    });
  await contactSheet.getByTestId("tap-contact-1").click();
  await expect
    .poll(() => getPools(page, actorId))
    .toEqual({
      network: 2,
      fred: 1,
    });
  const tapCard = lastChatMessage(page).getByTestId("network-contact-card");
  await expect(tapCard.getByTestId("network-contact-action")).toHaveText(
    "Tapped for information",
  );
  await expect(tapCard.getByTestId("network-contact-pool-change")).toHaveText(
    "Pool: 2 → 1",
  );
  await expect(contactSheet.getByTestId("tap-contact-2")).toBeDisabled();

  // the end of the operation: Network comes back to 4, Fred doesn't refresh
  await page.evaluate(
    (actorId) =>
      (
        game.actors.get(actorId)!.system as unknown as {
          refresh: () => Promise<void>;
        }
      ).refresh(),
    actorId,
  );
  await expect
    .poll(() => getPools(page, actorId))
    .toEqual({
      network: 4,
      fred: 1,
    });
  await expect(sheet.getByTestId("network-summary")).toHaveText(
    "Network: 4 of 5 left, 1 with contacts",
  );

  // he acts with his last point
  await forceDice(page, 6);
  const actRow = contactSheet.getByTestId("act-row");
  await expect(actRow.getByRole("radio", { name: "2" })).toBeDisabled();
  await actRow.getByText("1", { exact: true }).click();
  await contactSheet.getByTestId("test-contact").click();
  await expect
    .poll(() => getPools(page, actorId))
    .toEqual({
      network: 4,
      fred: 0,
    });
  const testCard = lastChatMessage(page).getByTestId("network-contact-card");
  await expect(testCard.getByTestId("network-contact-action")).toHaveText(
    "Test: 6 + 1 = 7",
  );
  await expect(testCard).toContainText("Favors exhausted");
  await expect(contactSheet.getByTestId("test-contact")).toBeDisabled();

  // and he's still on the list, with nothing left
  const row = sheet.getByTestId("network-contact-row");
  await expect(row).toHaveText(/Fred\s*Bangkok\s*0/);
});

test("the Contacts tab only shows when contacts are on", async ({ page }) => {
  await setSettings(page, { useNetworkContacts: false });
  const actorId = await createActor(page, { name: "Loner", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect(sheet.locator(".tab-strip > label")).not.toHaveCount(0);
  await expect(
    sheet.locator(".tab-strip > label", { hasText: "Contacts" }),
  ).toHaveCount(0);
});
