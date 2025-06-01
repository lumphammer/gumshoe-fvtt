import { ThemeSeedV1 } from "@lumphammer/investigator-fvtt-types";

import { defaultCustomThemePath } from "../constants";
import { assertGame, systemLogger } from "../functions/utilities";
import { FilePicker } from "../fvtt-exports";
import { settings } from "../settings/settings";
import { highContrastTheme } from "../themes/highContrastTheme";

export function loadCustomThemes() {
  const jsonRe = /\.(?:json|json5)$/;
  const yamlRe = /\.(?:yaml|yml)$/;
  const schemaRe = /^v(?:1)/;

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
      let blob: any = null;
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
        const seed: ThemeSeedV1 = {
          colors: {
            accent: highContrastTheme.colors.accent,
            accentContrast: highContrastTheme.colors.accentContrast,
            glow: highContrastTheme.colors.glow,
            wallpaper: highContrastTheme.colors.wallpaper,
            text: highContrastTheme.colors.text,
            backgroundButton: highContrastTheme.colors.backgroundButton,
            backgroundPrimary: highContrastTheme.colors.backgroundPrimary,
            backgroundSecondary: highContrastTheme.colors.backgroundSecondary,
            ...blob.colors,
          },
          displayName: blob.displayName,
          largeSheetRootStyle: blob.largeSheetRootStyle ?? {},
          logo: {
            backdropStyle:
              blob.logo?.backdropStyle ?? highContrastTheme.logo.backdropStyle,
            frontTextElementStyle:
              blob.logo?.frontTextElementStyle ??
              highContrastTheme.logo.frontTextElementStyle,
            rearTextElementStyle:
              blob.logo?.rearTextElementStyle ??
              highContrastTheme.logo.rearTextElementStyle,
            textElementsStyle:
              blob.logo?.textElementsStyle ??
              highContrastTheme.logo.textElementsStyle,
            fontScaleFactor: blob.logo?.fontScaleFactor,
          },
          schemaVersion: blob.schemaVersion,
          appWindowStyle: blob.appWindowStyle ?? {},
          bodyFont: blob.bodyFont ?? highContrastTheme.bodyFont,
          displayFont: blob.displayFont ?? highContrastTheme.displayFont,
          global: blob.global ?? highContrastTheme.global,
          smallSheetRootStyle: blob.smallSheetRootStyle ?? {},
        };
        systemLogger.log(`Loaded local theme ${filename}`, seed);
        CONFIG.Investigator?.installTheme(filename, seed);
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

  // CONFIG.Investigator.installTheme: (id: string, seed: ThemeSeedV1)
}
