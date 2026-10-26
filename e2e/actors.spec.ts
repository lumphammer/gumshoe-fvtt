import { createActor, expect, test } from "./foundry.ts";

test("new PCs' tokens are linked to them, and NPCs' aren't", async ({
  page,
}) => {
  const pcId = await createActor(page, { name: "Linked", type: "pc" });
  const npcId = await createActor(page, { name: "Unlinked", type: "npc" });
  // e.g. a duplicate of a PC from before PCs were linked
  const unlinkedPcId = await createActor(page, {
    name: "Unlinked PC",
    type: "pc",
    prototypeToken: { actorLink: false },
  });
  const isLinked = (id: string) =>
    page.evaluate((id) => game.actors.get(id)!.prototypeToken.actorLink, id);
  expect(await isLinked(pcId)).toBe(true);
  expect(await isLinked(npcId)).toBe(false);
  expect(await isLinked(unlinkedPcId)).toBe(false);
});

test("new actors' tokens show Health in bar 1", async ({ page }) => {
  const pcId = await createActor(page, { name: "Barred PC", type: "pc" });
  const npcId = await createActor(page, { name: "Barred NPC", type: "npc" });
  const bar1 = (id: string) =>
    page.evaluate(
      (id) => game.actors.get(id)!.prototypeToken.bar1.attribute,
      id,
    );
  expect(await bar1(pcId)).toBe("resources.health");
  expect(await bar1(npcId)).toBe("resources.health");
});
