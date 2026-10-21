import { useEffect, useReducer } from "react";

import { assertGame } from "../functions/isGame";

/**
 * The tokens this user has targeted, in the order they targeted them (as
 * attacks use them), re-rendering when they change.
 */
export function useUserTargets(): TokenDocument[] {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    // a target being renamed or deleted, or a new scene clearing them
    const hookNames = [
      "targetToken",
      "updateToken",
      "deleteToken",
      "canvasReady",
    ] as const;
    const ids = hookNames.map((hookName) => Hooks.on(hookName, forceUpdate));
    return () => {
      hookNames.forEach((name, i) => Hooks.off(name, ids[i]));
    };
  }, []);
  assertGame(game);
  return Array.from(game.user.targets).map((token) => token.document);
}
