import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { StatsSettingsEditor } from "../Stats/StatsSettingsEditor";
import type { Setters } from "../types";
import { AbilityPacksSettings } from "./AbilityPacksSettings";
import {
  npcAbilityPacks,
  npcStats,
  pcAbilityPacks,
  pcOptions,
  pcStats,
} from "./directions";
import { PcOptionsSettings } from "./PcOptionsSettings";

/**
 * Routes below the actors settings menu. These are mounted alongside the
 * actors settings panel rather than inside it, so they slide in over the whole
 * settings area.
 */
export const ActorSettingsRoutes = ({ setters }: { setters: Setters }) => {
  return (
    <>
      <SlideInNestedPanelRoute direction={pcOptions} margin="0em">
        <PcOptionsSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={pcAbilityPacks} margin="0em">
        <AbilityPacksSettings which="newPCPacks" setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={npcAbilityPacks} margin="0em">
        <AbilityPacksSettings which="newNPCPacks" setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={pcStats} margin="0em">
        <StatsSettingsEditor which="pcStats" />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={npcStats} margin="0em">
        <StatsSettingsEditor which="npcStats" />
      </SlideInNestedPanelRoute>
    </>
  );
};

ActorSettingsRoutes.displayName = "ActorSettingsRoutes";
