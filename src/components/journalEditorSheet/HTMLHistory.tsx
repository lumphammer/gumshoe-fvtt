import { DiffEditor } from "@monaco-editor/react";
import { useCallback, useMemo, useState } from "react";
import { AiOutlineHeart } from "react-icons/ai";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { createDocumentMemory } from "./documentMemory/createDocumentMemory";
import { getAccessibleEdits } from "./documentMemory/getAccessibleEdits";
import { rehydrate } from "./documentMemory/rehydrate";
import { restoreVersion } from "./documentMemory/restoreVersion";
import { getStoredDocumentMemory } from "./getStoredDocumentMemory";
import { ToolbarButton, useToolbarContent } from "./magicToolbar";
import { notifyJournalSaveError } from "./notifyJournalSaveError";
import { savePage } from "./savePage";

interface HTMLHistoryProps {
  page: any;
  cancelHistoryMode: () => void;
  saveDocument: (state: string) => void;
}

/**
 * Display a list of revisions of the page, shows, a diff, and publish a restore
 * button.
 */
export const HTMLHistory = ({
  page,
  saveDocument,
  cancelHistoryMode,
}: HTMLHistoryProps) => {
  const memory = useMemo(() => {
    const storedBarememory = getStoredDocumentMemory(page);
    if (storedBarememory) {
      return rehydrate(storedBarememory);
    } else {
      return createDocumentMemory(30);
    }
  }, [page]);
  const revisions = useMemo(
    () => getAccessibleEdits(memory).toReversed(),
    [memory],
  );

  const [activeDiffIndex, setActiveDiffIndex] = useState<number>(0);

  const [originalState, modifiedState] = useMemo(() => {
    if (revisions.length === 0) {
      return ["", ""];
    }
    const originalState =
      activeDiffIndex === revisions.length - 1
        ? ""
        : restoreVersion(memory, revisions[activeDiffIndex + 1].serial);
    const modifiedState = restoreVersion(
      memory,
      revisions[activeDiffIndex].serial,
    );
    return [originalState, modifiedState];
  }, [activeDiffIndex, memory, revisions]);

  const handleRestore = useCallback(async () => {
    const yes = await confirmADoodleDo({
      message: "Are you sure you want to restore this revision?",
      confirmText: "Restore",
      cancelText: "Cancel",
      confirmIconClass: "fa fa-heart",
      resolveFalseOnCancel: true,
      translate: false,
    });
    if (yes) {
      const state = restoreVersion(memory, revisions[activeDiffIndex].serial);
      try {
        await savePage(page, state, memory);
        cancelHistoryMode();
      } catch (error) {
        notifyJournalSaveError(error);
      }
    }
  }, [activeDiffIndex, cancelHistoryMode, memory, page, revisions]);

  const restoreButton = useMemo(
    () => (
      <>
        <ToolbarButton
          onClick={handleRestore}
          text="Restore"
          icon={AiOutlineHeart}
          disabled={activeDiffIndex === 0}
        />
      </>
    ),
    [activeDiffIndex, handleRestore],
  );

  useToolbarContent("History", restoreButton);

  return (
    <div
      css={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        css={{
          width: "15em",
          overflow: "auto",
        }}
      >
        <h3>Revisions</h3>
        {revisions.map((edit, i) => (
          <div
            key={edit.serial}
            css={{
              textDecoration: activeDiffIndex === i ? "underline" : "none",
            }}
          >
            <a onClick={() => setActiveDiffIndex(i)}>
              {edit.serial}: {new Date(edit.timestamp * 1000).toLocaleString()}
            </a>
          </div>
        ))}
      </div>
      <div
        css={{
          flex: 1,
        }}
      >
        <DiffEditor
          key={page.id}
          height="100%"
          width="100%"
          // defaultLanguage="html"
          original={originalState}
          modified={modifiedState}
          theme="vs-dark"
          // beforeMount={handleEditorWillMount}
          // onMount={handleEditorDidMount}
          // onChange={handleChange}
          language="html"
          options={{
            automaticLayout: true,
            scrollbar: {
              horizontal: "visible",
            },
            wordWrap: "off",
            rulers: [80],
            unicodeHighlight: {
              ambiguousCharacters: false,
            },
            renderSideBySide: false,
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
};

HTMLHistory.displayName = "HTMLHistory";
