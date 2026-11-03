import { useCallback, useMemo, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { MdOutlineHistory } from "react-icons/md";

import { HTMLEditor } from "./HTMLEditor";
import { HTMLHistory } from "./HTMLHistory";
import { ToolbarButton, useToolbarContent } from "./magicToolbar";

interface HTMLPageProps {
  page: any;
}

enum Mode {
  Edit = "edit",
  History = "history",
}

/**
 * Handle an HTML page - either editor of history mode.
 */
export const HTMLPage = ({ page }: HTMLPageProps) => {
  const [mode, setMode] = useState(Mode.Edit);

  const setEdit = useCallback(() => setMode(Mode.Edit), []);
  const setHistory = useCallback(() => setMode(Mode.History), []);

  const historyButton = useMemo(
    () => (
      <ToolbarButton
        onClick={setHistory}
        text="History"
        icon={MdOutlineHistory}
        disabled={mode === Mode.History}
      />
    ),
    [mode, setHistory],
  );

  const cancelHistoryButton = useMemo(
    () => (
      <ToolbarButton
        onClick={setEdit}
        text="Cancel"
        icon={AiOutlineClose}
        disabled={mode === Mode.Edit}
      />
    ),
    [mode, setEdit],
  );

  const handleSaveDocument = useCallback(
    (state: string) => {
      page.update({ content: state });
    },
    [page],
  );

  useToolbarContent("HTML", historyButton);
  useToolbarContent(
    "History",
    mode === Mode.History ? cancelHistoryButton : null,
  );

  if (mode === Mode.Edit) {
    return <HTMLEditor key={page.id} page={page} />;
  } else {
    return (
      <HTMLHistory
        key={page.id}
        page={page}
        cancelHistoryMode={setEdit}
        saveDocument={handleSaveDocument}
      />
    );
  }
};

HTMLPage.displayName = "HTMLPage";
