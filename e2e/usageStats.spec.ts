import type { Page } from "@playwright/test";

import {
  expect,
  reloadGame,
  setSettings,
  test,
  usageStatsEndpointPattern,
} from "./foundry.ts";

function getSetting(page: Page, key: string) {
  return page.evaluate(
    (key) => game.settings.get("investigator", key as never) as unknown,
    key,
  );
}

/** A world which hasn't been asked about usage stats yet. */
async function makeUnaskedWorld(page: Page) {
  // set them all, so whatever the test changes is put back afterwards
  await setSettings(page, {
    usageStatsConsent: "unset",
    usageStatsShareModules: false,
    usageStatsInstallId: "",
    usageStatsLastSentDay: "",
    usageStatsAskedVersion: "",
  });
}

/** Catch the reports the page sends, instead of sending them. */
async function catchReports(page: Page) {
  const reports: unknown[] = [];
  await page.route(usageStatsEndpointPattern, async (route) => {
    reports.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  return reports;
}

const offer = (page: Page) =>
  page
    .locator(".application.dialog")
    .filter({ hasText: "Share anonymous usage stats?" });

test("the test world has said no, so it isn't asked", async ({ page }) => {
  expect(await getSetting(page, "usageStatsConsent")).toBe("no");
  await expect(offer(page)).toHaveCount(0);
});

test("a GM can opt in to usage stats, with modules, and a report goes", async ({
  page,
}) => {
  await makeUnaskedWorld(page);
  const reports = await catchReports(page);
  await reloadGame(page);

  await expect(offer(page)).toContainText("can send a short, anonymous report");
  await offer(page).getByText("Show exactly what would be sent").click();
  const preview = offer(page).locator("pre");
  await expect(preview).not.toContainText('"modules"');
  await offer(page).getByLabel("Also share the list of active modules").check();
  await expect(preview).toContainText('"modules"');

  await offer(page).getByRole("button", { name: "Share usage stats" }).click();
  await expect(offer(page)).toHaveCount(0);
  await expect.poll(() => reports.length).toBe(1);

  const installId = await getSetting(page, "usageStatsInstallId");
  expect(installId).toMatch(/^[A-Za-z0-9_-]{22}$/);
  expect(reports[0]).toMatchObject({
    schemaVersion: 1,
    installId,
    package: { id: "investigator" },
    settings: { preset: "pathOfCthulhuPreset" },
    modules: expect.any(Array),
  });
  expect(await getSetting(page, "usageStatsLastSentDay")).not.toBe("");

  // once a day is enough
  await reloadGame(page);
  await expect(offer(page)).toHaveCount(0);
  expect(reports).toHaveLength(1);
});

test("after Ask me later, it isn't asked again on this version", async ({
  page,
}) => {
  await makeUnaskedWorld(page);
  const reports = await catchReports(page);
  await reloadGame(page);

  await offer(page).getByRole("button", { name: "Ask me later" }).click();
  await expect(offer(page)).toHaveCount(0);
  await expect
    .poll(() => getSetting(page, "usageStatsAskedVersion"))
    .not.toBe("");
  expect(await getSetting(page, "usageStatsConsent")).toBe("unset");

  await reloadGame(page);
  await expect(offer(page)).toHaveCount(0);
  expect(reports).toEqual([]);
});

test("No thanks is remembered, and nothing is sent", async ({ page }) => {
  await makeUnaskedWorld(page);
  const reports = await catchReports(page);
  await reloadGame(page);

  await offer(page).getByRole("button", { name: "No thanks" }).click();
  await expect.poll(() => getSetting(page, "usageStatsConsent")).toBe("no");
  await reloadGame(page);
  await expect(offer(page)).toHaveCount(0);
  expect(reports).toEqual([]);
});
