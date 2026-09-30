import { SlideInNestedPanelRoute } from "../../nestedPanels/SlideInNestedPanelRoute";
import { Category } from "./Category";
import { cardCategory } from "./directions";

/**
 * Routes below the cards settings page. These are mounted alongside the cards
 * settings panel rather than inside it, so they slide in over the whole
 * settings area.
 */
export const CardsSettingsRoutes = () => {
  return (
    <SlideInNestedPanelRoute direction={cardCategory} margin="0em">
      <Category />
    </SlideInNestedPanelRoute>
  );
};

CardsSettingsRoutes.displayName = "CardsSettingsRoutes";
