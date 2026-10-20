import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import type { Setters } from "../types";
import { BondsSettings } from "./BondsSettings";
import {
  bondsSettings,
  stabilityStates,
  traumaType,
  traumaTypes,
} from "./directions";
import { StabilityStatesSettings } from "./StabilityStatesSettings";
import { TraumaTypeSettings } from "./TraumaTypeSettings";
import { TraumaTypesSettings } from "./TraumaTypesSettings";

/**
 * Routes below the Sanity & Stability settings. These are mounted alongside
 * its panel rather than inside it, so they slide in over the whole settings
 * area.
 */
export const StabilitySettingsRoutes = ({ setters }: { setters: Setters }) => {
  return (
    <>
      <SlideInNestedPanelRoute direction={stabilityStates} margin="0em">
        <StabilityStatesSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute direction={bondsSettings} margin="0em">
        <BondsSettings setters={setters} />
      </SlideInNestedPanelRoute>
      <SlideInNestedPanelRoute
        direction={traumaTypes}
        margin="0em"
        childRoutes={
          <SlideInNestedPanelRoute direction={traumaType} margin="0em">
            <TraumaTypeSettings />
          </SlideInNestedPanelRoute>
        }
      >
        <TraumaTypesSettings setters={setters} />
      </SlideInNestedPanelRoute>
    </>
  );
};

StabilitySettingsRoutes.displayName = "StabilitySettingsRoutes";
