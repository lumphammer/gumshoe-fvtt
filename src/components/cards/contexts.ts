import { createContext } from "react";

import type { CardsAreaSettings } from "./types";

export const CardsAreaSettingsContext = createContext<CardsAreaSettings>({
  category: "all",
  sortOrder: "newest",
  viewMode: "short",
  columnWidth: "narrow",
});
