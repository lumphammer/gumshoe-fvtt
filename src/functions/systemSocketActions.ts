import * as constants from "../constants";
import { RequestTurnPassArgs, SystemSocketAction } from "../types";

export type SystemSocketActionHandlers = {
  requestNextTurn(requestingUserId: string): void;
  requestTurnPass(args: RequestTurnPassArgs, requestingUserId: string): void;
};

export function dispatchSystemSocketAction(
  action: SystemSocketAction,
  requestingUserId: string,
  handlers: SystemSocketActionHandlers,
): void {
  switch (action.type) {
    case "requestNextTurn":
      handlers.requestNextTurn(requestingUserId);
      break;
    case "requestTurnPass":
      handlers.requestTurnPass(
        { combatantId: action.combatantId },
        requestingUserId,
      );
      break;
  }
}

export function dispatchSystemSocketActionToHooks(
  action: SystemSocketAction,
  requestingUserId: string,
): void {
  dispatchSystemSocketAction(action, requestingUserId, {
    requestNextTurn: (userId) => Hooks.call(constants.nextTurn, userId),
    requestTurnPass: (args, userId) =>
      Hooks.call(constants.requestTurnPass, args, userId),
  });
}
