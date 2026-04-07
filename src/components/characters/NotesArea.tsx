import { useCallback } from "react";

import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { settings } from "../../settings/settings";
import { IndexedRichTextEditor } from "../inputs/IndexedRichTextEditor";
import { InputGrid } from "../inputs/InputGrid";
import { NotesTypeContext } from "../NotesTypeContext";

export const NotesArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const longNotesNames = settings.longNotes.get();

  const updateLongNote = useCallback(
    (value: string, index: number) => {
      void actor.system.setLongNote(index, value);
    },
    [actor.system],
  );

  return (
    <div
      css={{
        position: "absolute",
        inset: "0.5em",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      }}
    >
      {longNotesNames.map((name: string, i: number) => {
        return (
          <NotesTypeContext.Provider key={`${name}--${i}`} value="pcNote">
            <h3>{name}</h3>
            <div
              css={{
                flex: 1,
                position: "relative",
                minHeight: "10em",
              }}
            >
              <IndexedRichTextEditor
                index={i}
                html={actor.system.longNotes[i] ?? ""}
                onSave={updateLongNote}
              />
            </div>
          </NotesTypeContext.Provider>
        );
      })}
    </div>
  );
};
