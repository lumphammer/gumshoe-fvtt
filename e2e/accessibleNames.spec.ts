import type { Locator } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  test,
} from "./foundry.ts";

// Every control should have a name for a screen reader to announce: an
// icon-only button needs an `aria-label`, and an input a label.

const controlRoles =
  "button|link|radio|tab|switch|checkbox|textbox|combobox|menuitem|spinbutton|slider";

/** The controls in `part` with no accessible name, as Playwright lists them */
async function unnamedControls(part: Locator) {
  const snapshot = await part.ariaSnapshot();
  // a named control is `- button "Name"`; an unnamed one is `- button`,
  // perhaps with states (`[disabled]`) and a value (`: "3"`)
  const unnamed = new RegExp(
    `^\\s*- (${controlRoles})( \\[[^\\]]*\\])*(:.*)?$`,
  );
  return snapshot.split("\n").filter((line) => unnamed.test(line));
}

test("a PC sheet's controls all have names", async ({ page }) => {
  const actorId = await createActor(page, { name: "Named PC", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const content = sheet.locator(".window-content");
  for (const tab of ["Abilities", "Combat", "Equipment", "Notes"]) {
    await content.getByRole("tab", { name: tab }).click();
    await expect(content.getByRole("tab", { name: tab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await unnamedControls(content), `on the ${tab} tab`).toEqual([]);
  }
  await content.getByRole("tab", { name: "Abilities" }).click();
  await content.getByRole("switch", { name: "Edit mode" }).click();
  // a number field's buttons, described by what they change
  await expect(
    content.getByRole("button", {
      name: "Increase",
      description: "Athletics rating",
    }),
  ).toBeVisible();
  expect(await unnamedControls(content), "in edit mode").toEqual([]);
});

test("an NPC sheet's and a weapon sheet's controls all have names", async ({
  page,
}) => {
  const npcId = await createActor(page, { name: "Named NPC", type: "npc" });
  const npcSheet = await openSheet(page, `Actor.${npcId}`);
  expect(await unnamedControls(npcSheet.locator(".window-content"))).toEqual(
    [],
  );

  const pcId = await createActor(page, { name: "Armed PC", type: "pc" });
  const weaponId = await createOwnedItem(page, pcId, {
    name: "Named Gun",
    type: "weapon",
  });
  const weaponSheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  // a number field's buttons, named by its label
  await expect(
    weaponSheet.getByRole("button", {
      name: "Increase",
      description: "Bonus pool",
    }),
  ).toBeVisible();
  expect(await unnamedControls(weaponSheet.locator(".window-content"))).toEqual(
    [],
  );
});
