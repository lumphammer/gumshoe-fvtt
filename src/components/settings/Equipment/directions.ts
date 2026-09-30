import { createDirection } from "@lumphammer/minirouter";

/** param is the index of the category */
export const equipmentCategory = createDirection<number>("equipmentCategory");

/** param is the index of the field within its category */
export const equipmentField = createDirection<number>("equipmentField");
