import { getDevMode } from "../../../functions/utilities";
import { settings } from "../../../settings/settings";
import type { SettingsPageDef } from "../SettingsMenu";
import {
  customThemes,
  developerOptions,
  dyingEarthOptions,
  importExport,
  migrationRecovery,
} from "./directions";

/**
 * The pages under the miscellaneous settings menu, in menu order.
 */
export const miscPages: SettingsPageDef[] = [
  {
    direction: customThemes,
    label: "Custom themes",
    description: "CustomThemesDescription",
  },
  {
    direction: dyingEarthOptions,
    label: "Options for Dying Earth",
    description: "OptionsForDyingEarthDescription",
  },
  {
    direction: importExport,
    label: "Import/Export",
    description: "ImportExportDescription",
  },
  {
    direction: developerOptions,
    label: "Developer options",
    description: "DeveloperOptionsDescription",
  },
  {
    direction: migrationRecovery,
    label: "Migration recovery",
    description: "MigrationRecoveryDescription",
  },
];

/**
 * Some pages are only relevant some of the time, so we leave them out of the
 * menu otherwise.
 */
export const getVisibleMiscPages = () =>
  miscPages.filter(({ direction }) => {
    if (direction === developerOptions) {
      return getDevMode();
    }
    if (direction === migrationRecovery) {
      return settings.migrationLastError.get() !== "";
    }
    return true;
  });
