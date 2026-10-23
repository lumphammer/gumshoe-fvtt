import {
  createActor,
  expect,
  openSheet,
  reloadGame,
  setSettings,
  test,
} from "./foundry.ts";

test("theme fonts load from the system, not Google Fonts", async ({ page }) => {
  const fontRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "font" || /fonts\.g/.test(request.url())) {
      fontRequests.push(request.url());
    }
  });
  await setSettings(page, { defaultThemeName: "fearTheme" });
  const actorId = await createActor(page, { name: "Font Tester", type: "pc" });
  // reload, so we also see any font requests made while the game starts
  await reloadGame(page);

  await openSheet(page, `Actor.${actorId}`);

  // the theme's display font is only fetched once something on the page uses
  // it, so this also checks the sheet uses it
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.fonts].some(
          (face) => face.family === "Special Elite" && face.status === "loaded",
        ),
      ),
    )
    .toBe(true);
  expect(fontRequests).toContainEqual(
    expect.stringMatching(
      /\/systems\/investigator\/fonts\/fontsource\/special-elite-latin-400-normal\.woff2$/,
    ),
  );
  expect(fontRequests.filter((url) => /fonts\.g/.test(url))).toEqual([]);
});
