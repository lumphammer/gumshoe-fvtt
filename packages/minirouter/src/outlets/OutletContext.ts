import { createContext } from "react";

import type { OutletContextValue } from "../types";

/**
 * An Outlet is a bit of context-driven magic that allows you to control
 * rendering child routes. This is the context that it uses.
 */
export const OutletContext = createContext<OutletContextValue | null>(null);
