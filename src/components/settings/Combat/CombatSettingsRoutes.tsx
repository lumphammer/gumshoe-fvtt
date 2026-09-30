import { useContext } from "react";

import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { Translate } from "../../Translate";
import { StateContext } from "../contexts";
import { SettingsNote } from "../SettingsNote";
import { SettingsStringList } from "../SettingsStringList";
import type { Setters } from "../types";
import { CombatOptionsSettings } from "./CombatOptionsSettings";
import { combatAbilities, combatOptions } from "./directions";

/**
 * Routes below the combat settings menu. These are mounted alongside the
 * combat settings panel rather than inside it, so they slide in over the whole
 * settings area.
 */
export const CombatSettingsRoutes = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <>
      <SlideInNestedPanelRoute direction={combatAbilities} margin="0em">
        <SettingsNote>
          <Translate>CombatAbilitiesNote</Translate>
        </SettingsNote>
        <SettingsStringList
          value={settings.combatAbilities}
          onChange={setters.combatAbilities}
          nonempty
          sortable={false}
          addLabel="Add combat ability"
        />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={combatOptions} margin="0em">
        <CombatOptionsSettings setters={setters} />
      </SlideInNestedPanelRoute>
    </>
  );
};

CombatSettingsRoutes.displayName = "CombatSettingsRoutes";
