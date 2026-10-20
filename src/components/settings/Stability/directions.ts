import { createDirection } from "@lumphammer/minirouter";

export const stabilityStates = createDirection("stabilityStates");
export const bondsSettings = createDirection("bondsSettings");
export const traumaTypes = createDirection("traumaTypes");
// trauma types are routed by index, so that changing a type's id doesn't
// change the route
export const traumaType = createDirection<number>("traumaType");
