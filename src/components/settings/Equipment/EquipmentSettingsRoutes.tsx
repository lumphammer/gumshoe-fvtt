import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { equipmentCategory, equipmentField } from "./directions";
import { EquipmentCategorySettings } from "./EquipmentCategorySettings";
import { EquipmentFieldSettings } from "./EquipmentFieldSettings";

/**
 * Routes below the equipment categories list. These are mounted alongside the
 * list panel rather than inside it, so they slide in over the whole settings
 * area.
 */
export const EquipmentSettingsRoutes = () => {
  return (
    <SlideInNestedPanelRoute
      direction={equipmentCategory}
      margin="0em"
      childRoutes={
        <SlideInNestedPanelRoute direction={equipmentField} margin="0em">
          <EquipmentFieldSettings />
        </SlideInNestedPanelRoute>
      }
    >
      <EquipmentCategorySettings />
    </SlideInNestedPanelRoute>
  );
};

EquipmentSettingsRoutes.displayName = "EquipmentSettingsRoutes";
