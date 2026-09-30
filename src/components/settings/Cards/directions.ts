import { createDirection } from "@lumphammer/minirouter";

// card categories are routed by index, so that changing a category's id
// doesn't change the route
export const cardCategory = createDirection<number>("cardCategory");
