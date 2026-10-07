import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertNPCActor } from "../../module/actors/npc";
import { CharacterSheetSimple } from "./CharacterSheetSimple";

/** What people with Limited permission see of an NPC. */
export const NPCSheetSimple = () => {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  return <CharacterSheetSimple notes={actor.system.notes} />;
};

NPCSheetSimple.displayName = "NPCSheetSimple";
