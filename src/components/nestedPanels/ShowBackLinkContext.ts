import { createContext } from "react";

/**
 * Whether nested panels should render their own "Back" link. Turn this off for
 * a tree of panels which has some other way to navigate up, e.g. breadcrumbs.
 */
export const ShowBackLinkContext = createContext(true);
