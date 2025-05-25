import { isNPCActor, NPCActor } from "./npc";
import { isPCActor, PCActor } from "./pc";

export type ActiveCharacterActor = PCActor | NPCActor;

export function isActiveCharacterActor(x: unknown): x is ActiveCharacterActor {
  return isPCActor(x) || isNPCActor(x);
}

export function assertActiveCharacterActor(
  x: unknown,
): asserts x is ActiveCharacterActor {
  if (!isActiveCharacterActor(x)) {
    throw new Error("Expected a PC or NPC actor");
  }
}
