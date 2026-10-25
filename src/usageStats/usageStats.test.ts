import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildReport,
  getUsageStatsState,
  offerUsageStats,
  previewInstallId,
  previewReport,
  resetInstallId,
  sendUsageStatsIfDue,
  setSharing,
  type FoundryInfo,
  type OfferAnswer,
  type UsageStatsConfig,
} from "./usageStats";
import { buildOfferContent } from "./usageStatsDialog";

/** A fake `game`, with just what usage stats use. */
function fakeGame({
  isActiveGM = true,
  version = "10.130",
}: { isActiveGM?: boolean; version?: string } = {}) {
  const values = new Map<string, unknown>();
  const defaults = new Map<string, unknown>();
  const game = {
    version: "14.367",
    system: { id: "investigator", version, title: "GUMSHOE" },
    i18n: { lang: "en" },
    users: { size: 4, activeGM: { isSelf: isActiveGM } },
    modules: new Map(
      [
        { id: "dice-so-nice", version: "5.2.1", active: true },
        { id: "lib-wrapper", version: "1.13.0", active: true },
        { id: "inactive-module", version: "1.0.0", active: false },
      ].map((m) => [m.id, m]),
    ),
    settings: {
      register: (ns: string, key: string, data: { default: unknown }) =>
        defaults.set(`${ns}.${key}`, data.default),
      get: (ns: string, key: string) => {
        const id = `${ns}.${key}`;
        if (!defaults.has(id)) throw new Error(`${id} is not registered`);
        return values.has(id) ? values.get(id) : defaults.get(id);
      },
      set: (ns: string, key: string, value: unknown) => {
        values.set(`${ns}.${key}`, value);
        return Promise.resolve(value);
      },
    },
  };
  vi.stubGlobal("game", game);
  return game;
}

const config: UsageStatsConfig = {
  packageId: "investigator",
  endpoint: "https://ingest.example.net/v1/report",
  getSettings: () => ({ preset: "pathOfCthulhuPreset", useCards: false }),
  localize: (key, values) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
};

async function register() {
  const { registerUsageStatsSettings } = await import("./usageStats");
  registerUsageStatsSettings(config);
}

const info: FoundryInfo = {
  packageId: "investigator",
  packageVersion: "10.130",
  foundryVersion: "14.367",
  language: "en",
  userCount: 4,
  modules: [
    { id: "dice-so-nice", version: "5.2.1" },
    { id: "odd module!", version: "1.0" },
    { id: "no-version", version: "" },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  fakeGame();
  await register();
  fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildReport", () => {
  it("puts the report together, leaving out modules the server would refuse", () => {
    const report = buildReport(info, {
      installId: "kq7Xb2c9TzRf1mWd8sLp4a",
      settings: { preset: "pathOfCthulhuPreset" },
    });
    expect(report).toEqual({
      schemaVersion: 1,
      installId: "kq7Xb2c9TzRf1mWd8sLp4a",
      package: { id: "investigator", version: "10.130" },
      foundry: { version: "14.367" },
      language: "en",
      userCount: 4,
      settings: { preset: "pathOfCthulhuPreset" },
      modules: [{ id: "dice-so-nice", version: "5.2.1" }],
    });
  });

  it("leaves out settings if there aren't any", () => {
    const report = buildReport(info, { installId: "kq7Xb2c9TzRf1mWd8sLp4a" });
    expect(report).not.toHaveProperty("settings");
  });

  it("previews with only active modules, and a placeholder ID", () => {
    const report = previewReport(config);
    expect(report.installId).toBe(previewInstallId);
    expect(report.modules?.map((m) => m.id)).toEqual([
      "dice-so-nice",
      "lib-wrapper",
    ]);
  });
});

describe("offerUsageStats", () => {
  const answer = (result: OfferAnswer) => vi.fn(() => Promise.resolve(result));

  it("records a yes, with a new install ID", async () => {
    await offerUsageStats(config, answer("yes"));
    const state = getUsageStatsState(config);
    expect(state.consent).toBe("yes");
    expect(state.installId).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("records a no, and doesn't ask again", async () => {
    await offerUsageStats(config, answer("no"));
    expect(getUsageStatsState(config)).toMatchObject({
      consent: "no",
      installId: "",
    });

    const ask = answer("yes");
    await offerUsageStats(config, ask);
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks again after an update if the GM said later", async () => {
    await offerUsageStats(config, answer("later"));
    expect(getUsageStatsState(config).consent).toBe("unset");

    const ask = answer("later");
    await offerUsageStats(config, ask);
    expect(ask).not.toHaveBeenCalled();

    (game as unknown as { system: { version: string } }).system.version =
      "10.131";
    await offerUsageStats(config, ask);
    expect(ask).toHaveBeenCalledOnce();
  });

  it("doesn't ask without an endpoint", async () => {
    const ask = answer("no");
    await offerUsageStats({ ...config, endpoint: null }, ask);
    expect(ask).not.toHaveBeenCalled();
  });

  it("only asks on the active GM's client", async () => {
    fakeGame({ isActiveGM: false });
    await register();
    const ask = answer("no");
    await offerUsageStats(config, ask);
    expect(ask).not.toHaveBeenCalled();
  });
});

describe("sendUsageStatsIfDue", () => {
  const now = new Date("2026-10-24T10:00:00Z");

  it("sends nothing without consent", async () => {
    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends once a day", async () => {
    await setSharing(config, true);

    expect(await sendUsageStatsIfDue(config, now)).toBe(true);
    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getUsageStatsState(config).lastSentDay).toBe("2026-10-24");

    expect(
      await sendUsageStatsIfDue(config, new Date("2026-10-25T00:01:00Z")),
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sends a valid report, with the active modules", async () => {
    await setSharing(config, true);
    await sendUsageStatsIfDue(config, now);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(config.endpoint);
    const body = JSON.parse(init.body as string);
    expect(body).toEqual(
      expect.objectContaining({
        installId: getUsageStatsState(config).installId,
        settings: { preset: "pathOfCthulhuPreset", useCards: false },
        modules: [
          { id: "dice-so-nice", version: "5.2.1" },
          { id: "lib-wrapper", version: "1.13.0" },
        ],
      }),
    );
  });

  it("tries again later if the server refuses", async () => {
    await setSharing(config, true);
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 400 }));

    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
    expect(getUsageStatsState(config).lastSentDay).toBe("");
  });

  it("sends nothing without an endpoint", async () => {
    await setSharing(config, true);
    expect(await sendUsageStatsIfDue({ ...config, endpoint: null }, now)).toBe(
      false,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends nothing from other clients", async () => {
    await setSharing(config, true);
    (
      game as unknown as { users: { activeGM: { isSelf: boolean } } }
    ).users.activeGM.isSelf = false;
    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
  });
});

describe("setSharing", () => {
  it("keeps the install ID when sharing is turned off and on again", async () => {
    await setSharing(config, true);
    const { installId } = getUsageStatsState(config);

    await setSharing(config, false);
    expect(getUsageStatsState(config)).toMatchObject({
      consent: "no",
      installId,
    });
    expect(await sendUsageStatsIfDue(config)).toBe(false);

    await setSharing(config, true);
    expect(getUsageStatsState(config)).toMatchObject({
      consent: "yes",
      installId,
    });
  });

  it("resetInstallId makes a new one", async () => {
    await setSharing(config, true);
    const { installId } = getUsageStatsState(config);
    await resetInstallId(config);
    expect(getUsageStatsState(config).installId).not.toBe(installId);
    expect(getUsageStatsState(config).lastSentDay).toBe("");
  });
});

describe("the dialog's content", () => {
  // stands in for Foundry's, which strips scripts and event handlers
  const cleanHTML = vi.fn((html: string) => html.replace(/<img[^>]*>/g, ""));
  beforeEach(() => {
    vi.stubGlobal("foundry", { utils: { cleanHTML } });
  });

  it("previews the report", () => {
    const root = document.createElement("div");
    root.innerHTML = buildOfferContent(config);
    const pre = root.querySelector("pre")!;
    expect(JSON.parse(pre.textContent)).toEqual(previewReport(config));
  });

  it("lets the explanation use HTML, cleaned by Foundry", () => {
    const root = document.createElement("div");
    root.innerHTML = buildOfferContent({
      ...config,
      localize: (key) =>
        key === "UsageStatsOffer"
          ? "a <em>short</em> report<img src=x onerror=alert(1)>"
          : key,
    });
    expect(cleanHTML).toHaveBeenCalled();
    expect(root.querySelector(".usage-stats-offer em")?.textContent).toBe(
      "short",
    );
    expect(root.querySelector("img")).toBeNull();
  });

  it("shows the preview as text", () => {
    const root = document.createElement("div");
    root.innerHTML = buildOfferContent({
      ...config,
      getSettings: () => ({ preset: "<b>not markup</b>" }),
    });
    expect(root.querySelector("pre b")).toBeNull();
    expect(root.querySelector("pre")?.textContent).toContain(
      '"preset": "<b>not markup</b>"',
    );
  });
});

describe("the usageStats folder", () => {
  it("doesn't import anything from INVESTIGATOR, so it can move out", () => {
    const dir = import.meta.dirname;
    const allowed =
      /^(\.\/|@lumphammer\/fvtt-telemetry-schema(\/client)?$|vitest$|fs$|path$)/;
    for (const file of readdirSync(dir)) {
      const source = readFileSync(resolve(dir, file), "utf8");
      for (const [, from] of source.matchAll(
        /^(?:import|export)\b[^;]*?\bfrom "([^"]+)"/gm,
      )) {
        expect(from, `${file} imports ${from}`).toMatch(allowed);
      }
    }
  });
});
