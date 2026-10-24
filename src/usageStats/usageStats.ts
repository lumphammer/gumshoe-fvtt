/**
 * Opt-in, anonymous usage stats for a Foundry package (see
 * https://github.com/lumphammer/fvtt-telemetry).
 *
 * Nothing in this folder knows about INVESTIGATOR: the package passes in a
 * `UsageStatsConfig`. Keep it that way (a test checks the imports), so it can
 * move to a shared package for our other Foundry projects.
 */
import {
  createInstallId,
  idPattern,
  isReportDue,
  maxModules,
  parseReport,
  utcDay,
  type ReportV1,
  versionPattern,
} from "@lumphammer/fvtt-telemetry-schema";
import { sendReport } from "@lumphammer/fvtt-telemetry-schema/client";

export type UsageStatsConfig = {
  /** The reporting package's ID, which is also its settings namespace. */
  packageId: string;
  /**
   * Where reports go. While it's null, nothing is asked or sent, and the
   * settings page should be hidden.
   */
  endpoint: string | null;
  /**
   * Settings to report. Only ever values the package chose (preset IDs,
   * switches), never anything a user typed.
   */
  getSettings?: () => Record<string, string | number | boolean>;
  /** Translate a string key, with values to substitute. */
  localize: (key: string, values?: Record<string, string>) => string;
};

export type Consent = "unset" | "yes" | "no";

/** The world settings we keep, by their keys. */
export const settingKeys = {
  consent: "usageStatsConsent",
  installId: "usageStatsInstallId",
  lastSentDay: "usageStatsLastSentDay",
  askedVersion: "usageStatsAskedVersion",
} as const;

type SettingKey = (typeof settingKeys)[keyof typeof settingKeys];

/**
 * Just what we need of `game.settings`. (Typing settings through fvtt-types
 * needs each package's own declarations, which this folder can't know about.)
 */
type SettingsStore = {
  register(namespace: string, key: string, data: object): void;
  get(namespace: string, key: string): unknown;
  set(namespace: string, key: string, value: unknown): Promise<unknown>;
};

function store() {
  return game.settings as unknown as SettingsStore;
}

function get(config: UsageStatsConfig, key: SettingKey) {
  return store().get(config.packageId, key);
}

function set(config: UsageStatsConfig, key: SettingKey, value: unknown) {
  return store().set(config.packageId, key, value);
}

/** Register our settings. Call in the `init` hook. */
export function registerUsageStatsSettings(config: UsageStatsConfig) {
  const world = { scope: "world", config: false } as const;
  const register = (key: SettingKey, data: object) =>
    store().register(config.packageId, key, { ...world, ...data });
  register(settingKeys.consent, { type: String, default: "unset" });
  register(settingKeys.installId, { type: String, default: "" });
  register(settingKeys.lastSentDay, { type: String, default: "" });
  register(settingKeys.askedVersion, { type: String, default: "" });
}

export type UsageStatsState = {
  consent: Consent;
  installId: string;
  lastSentDay: string;
};

const asString = (value: unknown) => (typeof value === "string" ? value : "");

export function getUsageStatsState(config: UsageStatsConfig): UsageStatsState {
  const consent = get(config, settingKeys.consent);
  return {
    consent: consent === "yes" || consent === "no" ? consent : "unset",
    installId: asString(get(config, settingKeys.installId)),
    lastSentDay: asString(get(config, settingKeys.lastSentDay)),
  };
}

/** The version of the package doing the reporting. */
function packageVersion(packageId: string) {
  return game.system?.id === packageId
    ? game.system.version
    : (game.modules?.get(packageId)?.version ?? "");
}

/** What we read from Foundry for a report. */
export type FoundryInfo = {
  packageId: string;
  packageVersion: string;
  foundryVersion: string;
  language: string;
  userCount: number;
  modules: { id: string; version: string }[];
};

export function collectFoundryInfo(config: UsageStatsConfig): FoundryInfo {
  return {
    packageId: config.packageId,
    packageVersion: packageVersion(config.packageId),
    foundryVersion: game.version ?? "",
    language: game.i18n?.lang ?? "en",
    userCount: game.users?.size ?? 0,
    modules: [...(game.modules?.values() ?? [])]
      .filter((module) => module.active)
      .map((module) => ({ id: module.id, version: module.version ?? "" })),
  };
}

/** The ID shown in a preview when the world doesn't have one yet. */
export const previewInstallId = "xxxxxxxxxxxxxxxxxxxxxx";

/**
 * Put a report together. (The server only keeps modules in Foundry's public
 * package index.)
 */
export function buildReport(
  info: FoundryInfo,
  {
    installId,
    settings,
  }: {
    installId: string;
    settings?: Record<string, string | number | boolean>;
  },
): ReportV1 {
  return {
    schemaVersion: 1,
    installId,
    package: { id: info.packageId, version: info.packageVersion },
    foundry: { version: info.foundryVersion },
    language: info.language,
    userCount: info.userCount,
    ...(settings && Object.keys(settings).length > 0 ? { settings } : {}),
    // one odd module mustn't stop the whole report
    modules: info.modules
      .filter((m) => idPattern.test(m.id) && versionPattern.test(m.version))
      .slice(0, maxModules),
  };
}

/**
 * The report this world would send, for showing the GM. Uses a placeholder ID
 * if it hasn't got one yet.
 */
export function previewReport(config: UsageStatsConfig) {
  return buildReport(collectFoundryInfo(config), {
    installId: getUsageStatsState(config).installId || previewInstallId,
    settings: config.getSettings?.(),
  });
}

/** Whether this client should do the asking and sending for the world. */
function isActiveGM() {
  return game.users?.activeGM?.isSelf === true;
}

/**
 * Turn sharing on or off. The install ID is made the first time it's turned
 * on, and kept when it's turned off, so turning it back on carries on with it.
 */
export async function setSharing(config: UsageStatsConfig, share: boolean) {
  if (share && !getUsageStatsState(config).installId) {
    await set(config, settingKeys.installId, createInstallId());
  }
  await set(config, settingKeys.consent, share ? "yes" : "no");
}

/** Give the world a new install ID. */
export async function resetInstallId(config: UsageStatsConfig) {
  await set(config, settingKeys.installId, createInstallId());
  await set(config, settingKeys.lastSentDay, "");
}

export type OfferAnswer = "yes" | "no" | "later";

/**
 * Ask the GM whether to share usage stats, if we haven't got an answer.
 * "Ask me later" (or closing the dialog) asks again after the package's next
 * update.
 */
export async function offerUsageStats(
  config: UsageStatsConfig,
  ask: (config: UsageStatsConfig) => Promise<OfferAnswer>,
) {
  const version = packageVersion(config.packageId);
  if (
    config.endpoint === null ||
    !isActiveGM() ||
    getUsageStatsState(config).consent !== "unset" ||
    get(config, settingKeys.askedVersion) === version
  ) {
    return;
  }
  const answer = await ask(config);
  if (answer === "later") {
    await set(config, settingKeys.askedVersion, version);
  } else {
    await setSharing(config, answer === "yes");
  }
}

/**
 * Send today's report, if the world shares usage stats and hasn't sent one
 * today. Never throws.
 */
export async function sendUsageStatsIfDue(
  config: UsageStatsConfig,
  now = new Date(),
) {
  const state = getUsageStatsState(config);
  if (
    config.endpoint === null ||
    !isActiveGM() ||
    state.consent !== "yes" ||
    !state.installId ||
    !isReportDue(state.lastSentDay, now)
  ) {
    return false;
  }
  const result = parseReport(
    buildReport(collectFoundryInfo(config), {
      installId: state.installId,
      settings: config.getSettings?.(),
    }),
  );
  // a report the server would refuse isn't worth sending
  if (!result.success) return false;
  const sent = await sendReport(result.report, { endpoint: config.endpoint });
  if (sent) await set(config, settingKeys.lastSentDay, utcDay(now));
  return sent;
}
