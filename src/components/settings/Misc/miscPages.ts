import { getDevMode } from "../../../functions/utilities";
import { settings } from "../../../settings/settings";
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
export const miscPages = [
  { direction: customThemes, label: "Custom themes" },
  { direction: dyingEarthOptions, label: "Options for Dying Earth" },
  { direction: importExport, label: "Import/Export" },
  { direction: developerOptions, label: "Developer options" },
  { direction: migrationRecovery, label: "Migration recovery" },
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
