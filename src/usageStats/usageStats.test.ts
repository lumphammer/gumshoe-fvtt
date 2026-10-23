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
import { buildOfferContent, wirePreview } from "./usageStatsDialog";

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
  it("leaves out the modules unless they're shared", () => {
    const report = buildReport(info, {
      installId: "kq7Xb2c9TzRf1mWd8sLp4a",
      shareModules: false,
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
    });
  });

  it("leaves out modules the server would refuse", () => {
    const report = buildReport(info, {
      installId: "kq7Xb2c9TzRf1mWd8sLp4a",
      shareModules: true,
    });
    expect(report.modules).toEqual([{ id: "dice-so-nice", version: "5.2.1" }]);
    expect(report).not.toHaveProperty("settings");
  });

  it("previews with only active modules, and a placeholder ID", () => {
    const report = previewReport(config, true);
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
    await offerUsageStats(
      config,
      answer({ answer: "yes", shareModules: true }),
    );
    const state = getUsageStatsState(config);
    expect(state.consent).toBe("yes");
    expect(state.shareModules).toBe(true);
    expect(state.installId).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("records a no, and doesn't ask again", async () => {
    await offerUsageStats(config, answer({ answer: "no" }));
    expect(getUsageStatsState(config).consent).toBe("no");

    const ask = answer({ answer: "yes", shareModules: false });
    await offerUsageStats(config, ask);
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks again after an update if the GM said later", async () => {
    await offerUsageStats(config, answer({ answer: "later" }));
    expect(getUsageStatsState(config).consent).toBe("unset");

    const ask = answer({ answer: "later" });
    await offerUsageStats(config, ask);
    expect(ask).not.toHaveBeenCalled();

    (game as unknown as { system: { version: string } }).system.version =
      "10.131";
    await offerUsageStats(config, ask);
    expect(ask).toHaveBeenCalledOnce();
  });

  it("doesn't ask without an endpoint", async () => {
    const ask = answer({ answer: "no" });
    await offerUsageStats({ ...config, endpoint: null }, ask);
    expect(ask).not.toHaveBeenCalled();
  });

  it("only asks on the active GM's client", async () => {
    fakeGame({ isActiveGM: false });
    await register();
    const ask = answer({ answer: "no" });
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
    await setSharing(config, { share: true, shareModules: false });

    expect(await sendUsageStatsIfDue(config, now)).toBe(true);
    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getUsageStatsState(config).lastSentDay).toBe("2026-10-24");

    expect(
      await sendUsageStatsIfDue(config, new Date("2026-10-25T00:01:00Z")),
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sends a valid report, with modules only if they're shared", async () => {
    await setSharing(config, { share: true, shareModules: true });
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
    await setSharing(config, { share: true, shareModules: false });
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 400 }));

    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
    expect(getUsageStatsState(config).lastSentDay).toBe("");
  });

  it("sends nothing without an endpoint", async () => {
    await setSharing(config, { share: true, shareModules: false });
    expect(await sendUsageStatsIfDue({ ...config, endpoint: null }, now)).toBe(
      false,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends nothing from other clients", async () => {
    await setSharing(config, { share: true, shareModules: false });
    (
      game as unknown as { users: { activeGM: { isSelf: boolean } } }
    ).users.activeGM.isSelf = false;
    expect(await sendUsageStatsIfDue(config, now)).toBe(false);
  });
});

describe("setSharing", () => {
  it("forgets the install ID when sharing is turned off", async () => {
    await setSharing(config, { share: true, shareModules: true });
    await setSharing(config, { share: false, shareModules: true });
    expect(getUsageStatsState(config)).toEqual({
      consent: "no",
      shareModules: false,
      installId: "",
      lastSentDay: "",
    });
  });

  it("keeps the install ID when only the module setting changes", async () => {
    await setSharing(config, { share: true, shareModules: false });
    const { installId } = getUsageStatsState(config);
    await setSharing(config, { share: true, shareModules: true });
    expect(getUsageStatsState(config).installId).toBe(installId);
  });

  it("resetInstallId makes a new one", async () => {
    await setSharing(config, { share: true, shareModules: false });
    const { installId } = getUsageStatsState(config);
    await resetInstallId(config);
    expect(getUsageStatsState(config).installId).not.toBe(installId);
    expect(getUsageStatsState(config).lastSentDay).toBe("");
  });
});

describe("the dialog's content", () => {
  it("previews the report, and follows the module list box", () => {
    const root = document.createElement("div");
    root.innerHTML = buildOfferContent(config);
    wirePreview(root, config);
    const pre = root.querySelector("pre")!;
    expect(JSON.parse(pre.textContent)).not.toHaveProperty("modules");

    const checkbox = root.querySelector<HTMLInputElement>(
      'input[name="shareModules"]',
    )!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));
    expect(JSON.parse(pre.textContent).modules).toHaveLength(2);
  });

  it("doesn't let module names become markup", () => {
    (game as unknown as { modules: Map<string, object> }).modules.set("x", {
      id: "<img src=x onerror=alert(1)>",
      version: "1.0",
      active: true,
    });
    const root = document.createElement("div");
    root.innerHTML = buildOfferContent({
      ...config,
      localize: () => "<b>bold</b>",
    });
    expect(root.querySelector("img")).toBeNull();
    expect(root.querySelector("b")).toBeNull();
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
