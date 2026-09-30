import { useContext } from "react";

import { ListEdit } from "../../inputs/ListEdit";
import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { StateContext } from "../contexts";
import type { Setters } from "../types";
import {
  generalAbilityCategories,
  investigativeAbilityCategories,
  otherAbilityOptions,
} from "./directions";
import { OtherAbilityOptionsSettings } from "./OtherAbilityOptionsSettings";

/**
 * Routes below the abilities settings menu. These are mounted alongside the
 * abilities settings panel rather than inside it, so they slide in over the
 * whole settings area.
 */
export const AbilitySettingsRoutes = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);

  return (
    <>
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
      <SlideInNestedPanelRoute direction={otherAbilityOptions} margin="0em">
        <OtherAbilityOptionsSettings setters={setters} />
      </SlideInNestedPanelRoute>
    </>
  );
};

AbilitySettingsRoutes.displayName = "AbilitySettingsRoutes";
