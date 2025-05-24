import { isNPCActor, NPCActor } from "./npc";
import { isPCActor, PCActor } from "./pc";

export function isActiveCharacterActor(x: unknown): x is PCActor | NPCActor {
  return isPCActor(x) || isNPCActor(x);
}

export function assertActiveCharacterActor(
  x: unknown,
): asserts x is PCActor | NPCActor {
  if (!isActiveCharacterActor(x)) {
    throw new Error("Expected a PC or NPC actor");
  }
}
