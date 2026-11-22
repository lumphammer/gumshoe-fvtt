import { defaultCustomThemePath } from "../constants";
import { assertGame } from "../functions/isGame";
import { systemLogger } from "../functions/utilities";
import { FilePicker } from "../fvtt-exports";
import { settings } from "../settings/settings";
import { installTheme } from "./injectGlobalHelper";
import { v1SeedFromThemeFile } from "./v1SeedFromThemeFile";

export function loadCustomThemes() {
  const jsonRe = /\.(?:json|json5)$/;
  const yamlRe = /\.(?:yaml|yml)$/;
  const schemaRe = /^v(?:1|2)/;

  Hooks.on("setup", async () => {
    assertGame(game);
    const customThemePath = settings.customThemePath.get();
    systemLogger.log({ customThemePath });
    let files: string[] = [];

    try {
      const result = await FilePicker.browse("data", customThemePath, {});
      files = result.files;
    } catch {
      // probably the folder doesn't exist. if this is the case and the user has
      // modified the setting, warn them about it
      if (customThemePath !== defaultCustomThemePath) {
        if (game?.user?.isGM) {
          ui.notifications?.error(
            `Custom theme path "${customThemePath}" does not exist.`,
            {},
          );
        }
        return;
      }
    }
    systemLogger.log({ files });
    for (const filename of files) {
      let blob: any;
      try {
        const getText = async () => await (await fetch(filename)).text();
        if (jsonRe.test(filename)) {
          // JSON5 does something weird when imported dynamically, so we need to
          // grab the `default` property manually.
          // https://github.com/json5/json5/issues/287
          const [text, { default: JSON5 }] = await Promise.all([
            getText(),
            import("json5"),
          ]);
          blob = JSON5.parse(text);
        } else if (yamlRe.test(filename)) {
          const [text, yaml] = await Promise.all([getText(), import("yamljs")]);
          blob = yaml.parse(text);
        } else {
          continue;
        }
        if (!blob) {
          throw new Error("Could not parse");
        }
        if (!blob.displayName) {
          throw new Error("No displayName");
        }
        if (!blob.schemaVersion) {
          throw new Error("No schemaVersion");
        }
        if (!schemaRe.test(blob.schemaVersion)) {
          throw new Error(
            `schemaVersion "${blob.schemaVersion}" not recognised`,
          );
        }
        if (blob.schemaVersion === "v2") {
          // checked as it's installed: a theme that isn't one is refused
          installTheme(filename, blob, { type: "local" });
          systemLogger.log(`Loaded local theme ${filename}`, blob);
          continue;
        }
        const seed = v1SeedFromThemeFile(blob);
        systemLogger.log(`Loaded local theme ${filename}`, seed);
        installTheme(filename, seed, { type: "local" });
      } catch (e: any) {
        if (game?.user?.isGM) {
          ui.notifications?.error(
            `Problem with custom theme "${filename}": ${e?.message}.`,
            {},
          );
        }
      }
    }
  });
}
