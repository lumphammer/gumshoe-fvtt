import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { npcStats, pcStats } from "./directions";
import { StatsSettingsEditor } from "./StatsSettingsEditor";

/**
 * Routes below the stats settings menu. These are mounted alongside the stats
 * settings panel rather than inside it, so they slide in over the whole
 * settings area.
 */
export const StatsSettingsRoutes = () => {
  return (
    <>
      <SlideInNestedPanelRoute direction={pcStats} margin="0em">
        <StatsSettingsEditor which="pcStats" />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={npcStats} margin="0em">
        <StatsSettingsEditor which="npcStats" />
      </SlideInNestedPanelRoute>
    </>
  );
};

StatsSettingsRoutes.displayName = "StatsSettingsRoutes";
