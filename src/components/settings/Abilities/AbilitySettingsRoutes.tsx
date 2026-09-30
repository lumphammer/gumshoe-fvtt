import { useContext } from "react";

import { Translate } from "../../Translate";
import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { StateContext } from "../contexts";
import { SettingsNote } from "../SettingsNote";
import { SettingsStringList } from "../SettingsStringList";
import type { Setters } from "../types";
import { AbilityOptionsSettings } from "./AbilityOptionsSettings";
import { AbilityPacksSettings } from "./AbilityPacksSettings";
import {
  abilityOptions,
  generalAbilityCategories,
  investigativeAbilityCategories,
  npcAbilityPacks,
  pcAbilityPacks,
} from "./directions";

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
        <SettingsNote>
          <Translate>AbilityCategoriesNote</Translate>
        </SettingsNote>
        <SettingsStringList
          value={settings.investigativeAbilityCategories}
          onChange={setters.investigativeAbilityCategories}
          nonempty
          addLabel="Add ability category"
        />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute
        direction={generalAbilityCategories}
        margin="0em"
      >
        <SettingsNote>
          <Translate>AbilityCategoriesNote</Translate>
        </SettingsNote>
        <SettingsStringList
          value={settings.generalAbilityCategories}
          onChange={setters.generalAbilityCategories}
          nonempty
          addLabel="Add ability category"
        />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={pcAbilityPacks} margin="0em">
        <AbilityPacksSettings which="newPCPacks" setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={npcAbilityPacks} margin="0em">
        <AbilityPacksSettings which="newNPCPacks" setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={abilityOptions} margin="0em">
        <AbilityOptionsSettings setters={setters} />
      </SlideInNestedPanelRoute>
    </>
  );
};

AbilitySettingsRoutes.displayName = "AbilitySettingsRoutes";
