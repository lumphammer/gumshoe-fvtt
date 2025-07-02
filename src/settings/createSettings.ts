import { z } from "zod";

import * as c from "../constants";
import { assertGame } from "../functions/isGame";

const getSetting =
  <T = string>(key: string) =>
  (): T => {
    assertGame(game);
    // @ts-expect-error settings are typed now, but we're doing our own thing
    return game.settings.get(c.systemId, key) as T;
  };

const setSetting =
  <T = string>(key: string) =>
  (value: T) => {
    assertGame(game);
    // @ts-expect-error settings are typed now, but we're doing our own thing
    return game.settings.set(c.systemId, key, value);
  };

interface SettingFactoryArgs<T> {
  key: string;
  name: string;
  scope?: "world" | "client";
  config?: boolean;
  choices?: (T extends number | string ? Record<T, string> : never) | undefined;
  default: T;
  onChange?: (newVal: T) => void;
  exportable?: boolean;
}

interface SettingObject<T, TValidator extends z.ZodType | undefined> {
  key: string;
  get: () => T;
  // set: (value: T) => Promise<T>;
  set: (
    value: T,
  ) => Promise<
    ClientSettings.SettingInitializedType<
      "investigator",
      ClientSettings.KeyFor<"investigator">
    >
  >;
  exportable: boolean;
  validator?: TValidator;
}

// a nest of factories! I'll walk you through it...
export const createSetting =
  <TSetting>() =>
  // 👆 the first factory allows us to inject TSetting, the main type of the
  // setting (sorry about the comment position, this should be above the call
  // signature but prettier does something weird with it)
  //
  // 👇 the second factory allows us to inject TValidator, the type of
  // the validator for this setting factory. it's a separate call from
  // the first one so we can be explicit about TSetting but use inference for
  // TValidator. We also give Foundry its "type" (which is basically a
  // constructor) here.
  <
    TValidator extends
      | z.ZodType<TSetting>
      | z.ZodOptional<z.ZodType<TSetting>>
      | undefined = undefined,
  >(
    type: any,
    validator?: TValidator,
  ) =>
  // finally, the actual function that creates the setting. the args (see
  // SettingFactoryArgs<...> and SettingObject<...> at the end of the signature)
  // for this function are based on TSetting and TValidator
  ({
    default: _default,
    key,
    name,
    config = false,
    scope = "world",
    choices,
    onChange,
    exportable = true,
  }: SettingFactoryArgs<TSetting>): SettingObject<TSetting, TValidator> => {
    Hooks.once("init", () => {
      assertGame(game);
      // the actual foundry setting is registered here
      // @ts-expect-error settings are typed now, but we're doing our own thing
      game.settings.register(c.systemId, key, {
        name,
        scope,
        config,
        default: _default,
        type,
        choices,
        onChange,
      });
    });
    return {
      key,
      get: getSetting<TSetting>(key),
      set: setSetting<TSetting>(key),
      exportable,
      validator: validator as TValidator,
    };
  };

/**
 * Creates a setting object with a string value.
 */
// two nested factories, so we need two sets of parentheses. the first one
// is how we inject the type of the setting. the second one is where we supply
// the "type" that foundry wants and the validator.
export const createSettingString = createSetting<string>()(String, z.string());

export const createSettingArrayOfString = createSetting<string[]>()(
  Array,
  z.array(z.string()),
);

export const createSettingBoolean = createSetting<boolean>()(
  Boolean,
  z.boolean(),
);
