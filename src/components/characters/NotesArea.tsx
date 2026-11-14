import { memo, useCallback } from "react";

import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import { assertPCActor } from "../../module/actors/pc";
import { IndexedRichTextEditor } from "../inputs/IndexedRichTextEditor";
import { NotesTypeContext } from "../NotesTypeContext";
import { css } from "../../styled-system/css";

/** The PC's long notes, read through a snapshot */
export const NotesArea = memo(function NotesArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const longNotesNames = useSettings((s) => s.longNotes);
  const longNotes = useActorSnapshot(
    actor,
    (snapshot) => snapshot.system.longNotes,
  );
  const { setLongNote } = useSystemMethods(actor);

  const updateLongNote = useCallback(
    (value: string, index: number) => {
      void setLongNote(index, value);
    },
    [setLongNote],
  );

  return (
    <div
      className={css({
        position: "absolute",
        inset: "0.5em",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      })}
    >
      {longNotesNames.map((name, i) => {
        return (
          <NotesTypeContext.Provider key={`${name}--${i}`} value="pcNote">
            <h3>{name}</h3>
            <div
              className={css({
                flex: "[1]",
                position: "relative",
                minHeight: "10em",
              })}
            >
              <IndexedRichTextEditor
                name="longNotes"
                index={i}
                html={longNotes[i] ?? ""}
                onSave={updateLongNote}
              />
            </div>
          </NotesTypeContext.Provider>
        );
      })}
    </div>
  );
});
