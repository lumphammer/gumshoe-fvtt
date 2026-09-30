import { useContext } from "react";

import { ListEdit } from "../../inputs/ListEdit";
import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { StateContext } from "../contexts";
import { StatsSettingsEditor } from "../Stats/StatsSettingsEditor";
import type { Setters } from "../types";
import { AbilityPacksSettings } from "./AbilityPacksSettings";
import {
  generalAbilityCategories,
  investigativeAbilityCategories,
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
  const { settings } = useContext(StateContext);

  return (
    <>
      <SlideInNestedPanelRoute direction={pcOptions} margin="0em">
        <PcOptionsSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute
        direction={investigativeAbilityCategories}
        margin="0em"
      >
        <ListEdit
          value={settings.investigativeAbilityCategories}
          onChange={setters.investigativeAbilityCategories}
          nonempty
        />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute
        direction={generalAbilityCategories}
        margin="0em"
      >
        <ListEdit
          value={settings.generalAbilityCategories}
          onChange={setters.generalAbilityCategories}
          nonempty
        />
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
