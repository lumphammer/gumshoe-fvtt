import React, { Context } from "react";

import ApplicationV2 = foundry.applications.api.ApplicationV2;

export const FoundryAppContext: Context<ApplicationV2 | null> =
  React.createContext<foundry.applications.api.ApplicationV2 | null>(null);
