import { useContext } from "react";

import { ListEdit } from "../../inputs/ListEdit";
import { PersonalDetailsListEdit } from "../../inputs/PersonalDetailsListEdit";
import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { StateContext } from "../contexts";
import { StatsSettingsEditor } from "../Stats/StatsSettingsEditor";
import type { Setters } from "../types";
import {
  notesFields,
  npcStats,
  pcOptions,
  pcStats,
  personalDetails,
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
      <SlideInNestedPanelRoute direction={personalDetails} margin="0em">
        <PersonalDetailsListEdit
          personalDetails={settings.personalDetails}
          onChange={setters.personalDetails}
        />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={notesFields} margin="0em">
        <ListEdit value={settings.longNotes} onChange={setters.longNotes} />
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
