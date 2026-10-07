import {
  createActor,
  expect,
  openSheet,
  test,
  updateAbility,
} from "./foundry.ts";

test("dragging investigators onto a party sheet adds them up", async ({
  page,
}) => {
  const partyId = await createActor(page, { name: "The Party", type: "party" });
  const aliceId = await createActor(page, { name: "Alice", type: "pc" });
  const bobId = await createActor(page, { name: "Bob", type: "pc" });
  await updateAbility(page, aliceId, "Athletics", { rating: 2, pool: 2 });
  await updateAbility(page, bobId, "Athletics", { rating: 3, pool: 3 });

  const partySheet = await openSheet(page, `Actor.${partyId}`);
  await page.evaluate(() => {
    ui.sidebar.changeTab("actors", "primary");
  });
  for (const id of [aliceId, bobId]) {
    await page
      .locator(`#actors [data-entry-id="${id}"]`)
      .dragTo(partySheet.locator(".window-content"));
  }
  await expect
    .poll(() =>
      page.evaluate(
        (id) => game.actors.get(id)!.system.actorIds as string[],
        partyId,
      ),
    )
    .toEqual([aliceId, bobId]);
  await expect(partySheet).toContainText("Alice");
  await expect(partySheet).toContainText("Bob");
  // Athletics: 2, 3, and a total of 5
  await expect(partySheet).toContainText(/Athletics\s*2\s*3\s*5/);

  await partySheet.getByRole("button", { name: "REMOVE" }).first().click();
  await expect
    .poll(() =>
      page.evaluate(
        (id) => game.actors.get(id)!.system.actorIds as string[],
        partyId,
      ),
    )
    .toEqual([bobId]);
});

test("adding two members at once keeps both", async ({ page }) => {
  const partyId = await createActor(page, {
    name: "Busy Party",
    type: "party",
  });
  const carolId = await createActor(page, { name: "Carol", type: "pc" });
  const daveId = await createActor(page, { name: "Dave", type: "pc" });
  await page.evaluate(
    async ({ partyId, carolId, daveId }) => {
      const party = game.actors.get(partyId)! as unknown as {
        system: { addActorIds: (ids: string[]) => Promise<unknown> };
      };
      // like two quick drops
      await Promise.all([
        party.system.addActorIds([carolId]),
        party.system.addActorIds([daveId]),
      ]);
    },
    { partyId, carolId, daveId },
  );
  expect(
    await page.evaluate(
      (id) => game.actors.get(id)!.system.actorIds as string[],
      partyId,
    ),
  ).toEqual([carolId, daveId]);
});
