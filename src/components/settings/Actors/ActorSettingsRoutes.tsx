import { useContext } from "react";

import { Translate } from "../../Translate";
import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { StateContext } from "../contexts";
import { SettingsNote } from "../SettingsNote";
import { SettingsStringList } from "../SettingsStringList";
import { stat } from "../Stats/directions";
import { StatSettings } from "../Stats/StatSettings";
import { StatsListSettings } from "../Stats/StatsListSettings";
import type { Setters } from "../types";
import {
  notesFields,
  npcStats,
  pcOptions,
  pcStats,
  personalDetail,
  personalDetails,
} from "./directions";
import { PcOptionsSettings } from "./PcOptionsSettings";
import { PersonalDetailSettings } from "./PersonalDetailSettings";
import { PersonalDetailsSettings } from "./PersonalDetailsSettings";

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
        direction={personalDetails}
        margin="0em"
        childRoutes={
          <SlideInNestedPanelRoute direction={personalDetail} margin="0em">
            <PersonalDetailSettings />
          </SlideInNestedPanelRoute>
        }
      >
        <PersonalDetailsSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={notesFields} margin="0em">
        <SettingsNote>
          <Translate>PositionalFieldsNote</Translate>
        </SettingsNote>
        <SettingsStringList
          value={settings.longNotes}
          onChange={setters.longNotes}
          addLabel="Add notes field"
          emptyMessage="No notes fields yet."
        />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute
        direction={pcStats}
        margin="0em"
        childRoutes={
          <SlideInNestedPanelRoute direction={stat} margin="0em">
            <StatSettings which="pcStats" />
          </SlideInNestedPanelRoute>
        }
      >
        <StatsListSettings which="pcStats" />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute
        direction={npcStats}
        margin="0em"
        childRoutes={
          <SlideInNestedPanelRoute direction={stat} margin="0em">
            <StatSettings which="npcStats" />
          </SlideInNestedPanelRoute>
        }
      >
        <StatsListSettings which="npcStats" />
      </SlideInNestedPanelRoute>
    </>
  );
};

ActorSettingsRoutes.displayName = "ActorSettingsRoutes";
