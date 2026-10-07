import * as constants from "../constants";
import type {
  EditAttackArgs,
  RequestTurnPassArgs,
  SystemSocketAction,
} from "../types";

export type SystemSocketActionHandlers = {
  requestNextTurn(requestingUserId: string): void;
  requestTurnPass(args: RequestTurnPassArgs, requestingUserId: string): void;
  editAttack(args: EditAttackArgs, requestingUserId: string): void;
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
    case "editAttack":
      handlers.editAttack(
        { messageId: action.messageId, edit: action.edit },
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
    editAttack: (args, userId) =>
      Hooks.call(constants.editAttack, args, userId),
  });
}
