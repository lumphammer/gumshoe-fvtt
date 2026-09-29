import React from "react";

import { tealTheme } from "./tealTheme";
import type { ThemeV1 } from "./types";

export const ThemeContext = React.createContext<ThemeV1>(tealTheme);
