import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import type { Setters } from "../types";
import { CustomThemesSettings } from "./CustomThemesSettings";
import { DeveloperSettings } from "./DeveloperSettings";
import {
  customThemes,
  developerOptions,
  dyingEarthOptions,
  importExport,
  migrationRecovery,
} from "./directions";
import { DyingEarthSettings } from "./DyingEarthSettings";
import { ImportExportSettings } from "./ImportExportSettings";
import { MigrationRecoverySettings } from "./MigrationRecoverySettings";

/**
 * Routes below the miscellaneous settings menu. These are mounted alongside
 * the miscellaneous settings panel rather than inside it, so they slide in
 * over the whole settings area.
 */
export const MiscSettingsRoutes = ({ setters }: { setters: Setters }) => {
  return (
    <>
      <SlideInNestedPanelRoute direction={customThemes} margin="0em">
        <CustomThemesSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={dyingEarthOptions} margin="0em">
        <DyingEarthSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={importExport} margin="0em">
        <ImportExportSettings />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={developerOptions} margin="0em">
        <DeveloperSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={migrationRecovery} margin="0em">
        <MigrationRecoverySettings />
      </SlideInNestedPanelRoute>
    </>
  );
};

MiscSettingsRoutes.displayName = "MiscSettingsRoutes";
