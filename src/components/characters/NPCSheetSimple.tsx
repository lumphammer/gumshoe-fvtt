import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertNPCActor } from "../../module/actors/npc";
import { CharacterSheetSimple } from "./CharacterSheetSimple";

/** What people with Limited permission see of an NPC. */
export const NPCSheetSimple = () => {
  const { actor } = useActorSheetContext();
  assertNPCActor(actor);
  const notes = useActorSnapshot(
    actor,
    (snapshot) =>
      (snapshot?.system as { notes?: string } | undefined)?.notes ?? "",
  );
  return <CharacterSheetSimple notes={notes} />;
};

NPCSheetSimple.displayName = "NPCSheetSimple";
