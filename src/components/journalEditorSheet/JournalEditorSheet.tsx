import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { MdOutlinePreview } from "react-icons/md";

import { extraCssClasses, systemId } from "../../constants";
import { getIsEditable, IsEditableContext } from "../../hooks/useIsEditable";
import { useJournalEntrySnapshot } from "../../hooks/useJournalEntrySnapshot";
import { useJournalEntrySheetContext } from "../../hooks/useSheetContexts";
import { useTheme } from "../../hooks/useTheme";
import { InvestigatorJournalSheet } from "../../module/InvestigatorJournalSheet";
import { absoluteCover } from "../absoluteCover";
import { CSSReset } from "../CSSReset";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { MagicToolbar } from "./magicToolbar/MagicToolbar";
import { MagicToolbarProvider } from "./magicToolbar/MagicToolbarProvider";
import { ToolbarButton } from "./magicToolbar/ToolbarButton";
import { NoPageSelected } from "./NoPageSelected";
import { PageEditor } from "./PageEditor";
import { PageNavigation } from "./PageNavigation";

const KEEPALIVE_INTERVAL_MS = 30_000;

/** A flag's value, if it's a string */
const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/**
 * Re-render when compendiums are configured (e.g. locked or unlocked): an entry
 * in a compendium can only be edited while it's unlocked, and that's in a
 * setting, not the entry. (A hook, so it isn't compiled.)
 */
function useCompendiumConfigChanges() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const onSetting = (setting: { key: string }) => {
      if (setting.key === "core.compendiumConfiguration") forceUpdate();
    };
    const ids = [
      Hooks.on("createSetting", onSetting),
      Hooks.on("updateSetting", onSetting),
    ];
    return () => {
      Hooks.off("createSetting", ids[0]);
      Hooks.off("updateSetting", ids[1]);
    };
  }, []);
}

/**
 * Top-level react component for the journal editor sheet. It reads the entry
 * and its pages through their snapshot, so Foundry's renders don't need to
 * reach it (the sheet class passes `rerenderOnFoundryRender: false`); pages
 * are looked up live only to hand to the page editor, to write through.
 */
export const JournalEditorSheet = () => {
  "use memo";

  const { app, journalEntry } = useJournalEntrySheetContext();
  // editability is read again on every render (in the selector below)
  useCompendiumConfigChanges();
  const view = useJournalEntrySnapshot(journalEntry, (entry) => ({
    name: entry.name,
    globalClasses: asString(entry.flags[systemId]?.[extraCssClasses]),
    pageIds: entry.pages.map((page) => page._id),
    // (from the live app, but a selector runs again on every change to the
    // entry, its ownership included)
    isEditable: getIsEditable(app),
  }));

  // keepalive - without this, if this journal entry is inside a compendium,
  // foundry will kill the in-memory references to it so normal UI updates stop
  // coming through. An empty update doesn't send any network traffic but it's
  // enough to keep the journal entry alive. The timeout in foundry is 5 minutes
  // so a 30 second keepalive is plenty.
  useEffect(() => {
    const interval = setInterval(() => {
      void journalEntry.update({});
    }, KEEPALIVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [journalEntry]);

  const theme = useTheme();

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const handlePageClick = useCallback(
    (pageId: string) => {
      setActivePageId(pageId);
    },
    [setActivePageId],
  );

  const handlePreview = useCallback(() => {
    // @xts-expect-error tsgo "excessive stack depth"
    const sheet = new InvestigatorJournalSheet({ document: journalEntry });

    void sheet.render({
      force: true,
    });
  }, [journalEntry]);

  const toolBarContent = useMemo(
    () => (
      <ToolbarButton
        onClick={handlePreview}
        icon={MdOutlinePreview}
        text="Preview"
      />
    ),
    [handlePreview],
  );

  const handleTitleChange = useCallback(
    (name: string) => {
      void journalEntry.update({ name });
    },
    [journalEntry],
  );

  const globalClasses = view.globalClasses;

  const handleGlobalClassesChange = useCallback(
    (classes: string) => {
      void journalEntry.setFlag(systemId, extraCssClasses, classes);
    },
    [journalEntry],
  );

  return (
    <IsEditableContext.Provider value={view.isEditable}>
      <MagicToolbarProvider>
        <CSSReset
          theme={theme}
          mode="large"
          css={{
            ...absoluteCover,
            display: "flex",
            gap: "0.5em",
            flexDirection: "column",
          }}
        >
          <MagicToolbar
            categories={["Core", "Create new", "Page", "HTML", "History"]}
            childrenCategory="Core"
          >
            {toolBarContent}
          </MagicToolbar>
          <div
            css={{
              display: "flex",
              flexDirection: "row",
              gap: "0.5em",
            }}
          >
            <AsyncTextInput value={view.name} onChange={handleTitleChange} />
            <AsyncTextInput
              placeholder="Journal CSS Classes"
              value={globalClasses}
              onChange={handleGlobalClassesChange}
            />
          </div>
          <div
            css={{
              display: "flex",
              flexDirection: "row",
              gap: "0.5em",
              flex: 1,
            }}
          >
            <div
              data-testid="page-navigation"
              css={{
                flexBasis: "20em",
                minWidth: "20em",
                position: "relative",
              }}
            >
              <PageNavigation
                journalEntry={journalEntry}
                onNavigate={handlePageClick}
                activePageId={activePageId}
              />
            </div>
            <div
              data-testid="page-editor"
              css={{
                flex: 1,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {activePageId !== null && view.pageIds.includes(activePageId) ? (
                <PageEditor page={journalEntry.pages.get(activePageId)} />
              ) : (
                <NoPageSelected />
              )}
            </div>
          </div>
        </CSSReset>
      </MagicToolbarProvider>
    </IsEditableContext.Provider>
  );
};

JournalEditorSheet.displayName = "JournalEditorSheet";
