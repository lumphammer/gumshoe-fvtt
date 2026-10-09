import { createActor, expect, openSheet, test } from "./foundry.ts";

// Text fields save as you type, a little at a time, and ignore the saves
// coming back while you're still typing.

test("typing slowly into a field saves everything, in the end", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "A", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const name = sheet.getByLabel("Name", { exact: true });

  await name.fill("");
  // slow enough that several saves (and their echoes) happen while typing
  await name.pressSequentially("Professor Henry Armitage", { delay: 80 });
  await expect(name).toHaveValue("Professor Henry Armitage");
  await expect
    .poll(() => page.evaluate((id) => game.actors.get(id)!.name, actorId))
    .toBe("Professor Henry Armitage");
  // and the echoes didn't put anything back in the field
  await expect(name).toHaveValue("Professor Henry Armitage");
});

test("closing the sheet straight after typing keeps the change", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "B", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const name = sheet.getByLabel("Name", { exact: true });
  await name.fill("Wilbur Whateley");
  await page.evaluate((id) => game.actors.get(id)!.sheet!.close(), actorId);
  await expect
    .poll(() => page.evaluate((id) => game.actors.get(id)!.name, actorId))
    .toBe("Wilbur Whateley");
});
