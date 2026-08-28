import { describe, expect, it, vi } from "vitest";

import {
  getSettingsSaveErrorMessage,
  saveSettings,
  SettingsSaveError,
} from "./saveSettings";

const setting = (
  set: (value: any) => Promise<unknown>,
  parse: (value: unknown) => unknown = (value) => value,
) => ({ managedBySettingsForm: true, set, validator: { parse } });

describe("saveSettings", () => {
  it("validates the whole draft before writing anything", async () => {
    const events: string[] = [];
    const definitions = {
      first: setting(
        () => Promise.resolve(events.push("set first")),
        (value) => events.push(`validate first ${String(value)}`),
      ),
      second: setting(
        () => Promise.resolve(events.push("set second")),
        (value) => events.push(`validate second ${String(value)}`),
      ),
    };

    await saveSettings({ first: "a", second: "b" }, definitions);

    expect(events.slice(0, 2)).toEqual([
      "validate first a",
      "validate second b",
    ]);
    expect(events.slice(2).sort()).toEqual(["set first", "set second"]);
  });

  it("writes settings concurrently rather than one round trip at a time", async () => {
    const inFlight: string[] = [];
    let releaseWrites: () => void = vi.fn();
    const writesCanFinish = new Promise<void>((resolve) => {
      releaseWrites = resolve;
    });
    const definitions = Object.fromEntries(
      ["first", "second", "third"].map((key) => [
        key,
        setting(async () => {
          inFlight.push(key);
          await writesCanFinish;
        }),
      ]),
    );

    const save = saveSettings({ first: 1, second: 2, third: 3 }, definitions);

    // all three writes are outstanding while none of them has resolved
    await vi.waitFor(() => expect(inFlight).toHaveLength(3));
    releaseWrites();
    await save;
  });

  it("writes nothing when any managed setting is invalid", async () => {
    const firstSet = vi.fn(() => Promise.resolve(undefined));
    const validationError = new Error("bad value");
    const definitions = {
      first: setting(firstSet),
      second: setting(
        () => Promise.resolve(undefined),
        () => {
          throw validationError;
        },
      ),
    };

    await expect(
      saveSettings({ first: "a", second: "b" }, definitions),
    ).rejects.toMatchObject({
      phase: "validation",
      failedSettingKeys: ["second"],
      savedSettingKeys: [],
      cause: validationError,
    });
    expect(firstSet).not.toHaveBeenCalled();
  });

  it("reports every invalid setting, not just the first", async () => {
    const invalid = (key: string) =>
      setting(
        () => Promise.resolve(undefined),
        () => {
          throw new Error(`${key} is bad`);
        },
      );

    let error: unknown;
    try {
      await saveSettings(
        { first: 1, second: 2, third: 3 },
        {
          first: invalid("first"),
          second: setting(() => Promise.resolve(undefined)),
          third: invalid("third"),
        },
      );
    } catch (cause) {
      error = cause;
    }

    expect(error).toMatchObject({
      phase: "validation",
      failedSettingKeys: ["first", "third"],
    });
    expect(getSettingsSaveErrorMessage(error as SettingsSaveError)).toBe(
      'Could not save settings: "first", "third" are invalid. No settings were changed.',
    );
  });

  it("saves what it can and reports the settings which failed", async () => {
    const writeError = new Error("Foundry rejected the write");
    const thirdSet = vi.fn(() => Promise.resolve(undefined));
    const definitions = {
      first: setting(() => Promise.resolve(undefined)),
      second: setting(() => Promise.reject(writeError)),
      third: setting(thirdSet),
    };

    let error: unknown;
    try {
      await saveSettings({ first: 1, second: 2, third: 3 }, definitions);
    } catch (cause) {
      error = cause;
    }

    expect(error).toBeInstanceOf(SettingsSaveError);
    expect(error).toMatchObject({
      phase: "write",
      failedSettingKeys: ["second"],
      savedSettingKeys: ["first", "third"],
      cause: writeError,
    });
    // a failed write must not stop the settings after it from being saved
    expect(thirdSet).toHaveBeenCalledOnce();
    expect(getSettingsSaveErrorMessage(error as SettingsSaveError)).toBe(
      'Could not save setting "second". 2 other settings were saved; review your changes before trying again.',
    );
  });

  it("ignores settings not managed by the form", async () => {
    const externalSet = vi.fn(() => Promise.resolve(undefined));
    const definitions = {
      formSetting: setting(() => Promise.resolve(undefined)),
      externalSetting: {
        managedBySettingsForm: false,
        set: externalSet,
        validator: {
          parse: () => {
            throw new Error("stale external value");
          },
        },
      },
    };

    await saveSettings(
      { formSetting: "current", externalSetting: "stale" },
      definitions,
    );

    expect(externalSet).not.toHaveBeenCalled();
  });
});
