import { createContext } from "react";

export const IdContext = createContext<string | undefined>(undefined);

/**
 * The id of the label for the control with this `IdContext` id: for a control
 * made of several elements (`CheckButtons`) to name its group by
 */
export const labelIdFor = (id: string) => `${id}-label`;
