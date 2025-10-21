import { useCallback } from "react";

import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { settings } from "../../settings/settings";
import { NoteWithFormat } from "../../types";
import { IndexedNotesEditorWithControls } from "../inputs/IndexedNotesEditorWithControls";
import { InputGrid } from "../inputs/InputGrid";
import { NotesTypeContext } from "../NotesTypeContext";

export const NotesArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const longNotesNames = settings.longNotes.get();

  const updateLongNote = useCallback(
    (value: NoteWithFormat, index: number) => {
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
            <InputGrid css={{ flex: 1, minHeight: "12em" }}>
              <IndexedNotesEditorWithControls
                title={name}
                index={i}
                allowChangeFormat={false}
                format={actor.system.longNotesFormat}
                html={actor.system.longNotes[i]?.html ?? ""}
                source={actor.system.longNotes[i]?.source ?? ""}
                onSave={updateLongNote}
              />
            </InputGrid>
          </NotesTypeContext.Provider>
        );
      })}
    </div>
  );
};
