import { ApplicationV2 } from "../fvtt-exports";

export function assertApplicationV2(app: any): asserts app is ApplicationV2 {
  if (!(app instanceof ApplicationV2)) {
    throw new Error("App is not an ApplicationV2");
  }
}
