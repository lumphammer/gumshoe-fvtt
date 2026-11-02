import type { Context } from "react";
import React from "react";

import ApplicationV2 = foundry.applications.api.ApplicationV2;

export const FoundryAppContext: Context<ApplicationV2 | null> =
  React.createContext<foundry.applications.api.ApplicationV2 | null>(null);

/**
 * How many times Foundry has rendered the app, which changes on each render
 * (when `rerenderOnFoundryRender` is on). Reading it re-renders a component
 * with Foundry, even past memoised parents: for components which read
 * something live from the app, such as `app.isEditable`.
 */
export const FoundryRenderSerialContext: Context<number> =
  React.createContext(0);
