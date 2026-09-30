import { createDirection } from "@lumphammer/minirouter";

export const pcOptions = createDirection("pcOptions");
export const personalDetails = createDirection("personalDetails");
export const notesFields = createDirection("notesFields");
export const pcStats = createDirection("pcStats");
export const npcStats = createDirection("npcStats");
/** param is the index of the personal detail */
export const personalDetail = createDirection<number>("personalDetail");
