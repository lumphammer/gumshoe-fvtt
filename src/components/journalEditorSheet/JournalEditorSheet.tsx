import React, { useEffect, useMemo } from "react";
import { MdOutlinePreview } from "react-icons/md";

import { extraCssClasses, systemId } from "../../constants";
import { useTheme } from "../../hooks/useTheme";
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

type JournalEditorSheetProps = {
  journalEntry: JournalEntry;
  foundryApplication: JournalSheet;
};

/**
 * Top-level react component for the journal editor sheet.
 */
export const JournalEditorSheet = ({
  journalEntry,
  foundryApplication,
}: JournalEditorSheetProps) => {
  // keepalive - without this, if this journal entry is inside a compendium,
  // foundry will kill the in-memory references to it so normal UI updates stop
  // coming through. An empty update doesn't send any network traffic but it's
  // enough to keep the journal entry alive. The timeout in foundry is 5 minutes
  // so a 30 second keepalive is plenty.
  useEffect(() => {
    const interval = setInterval(() => {
      journalEntry.update({});
    }, KEEPALIVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [journalEntry]);

  const theme = useTheme();

  const [activePageId, setActivePageId] = React.useState<string | null>(null);
  const handlePageClick = React.useCallback(
    (pageId: string) => {
      setActivePageId(pageId);
    },
    [setActivePageId],
  );

  const handlePreview = React.useCallback(() => {
    const JournalSheet: JournalSheet = Journal.registeredSheets.find(
      // @ts-expect-error Journal types are effed
      (sheet) => sheet.name === "InvestigatorJournalSheet",
    ) as unknown as JournalSheet;
    // @ts-expect-error Journal types are effed
    new JournalSheet(journalEntry).render(true);
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

  const handleTitleChange = React.useCallback(
    (name: string) => {
      journalEntry.update({ name });
    },
    [journalEntry],
  );

  // @ts-expect-error - foundry types are bad
  const globalClasses = journalEntry.flags[systemId]?.[extraCssClasses] ?? "";

  const handleGlobalClassesChange = React.useCallback(
    (classes: string) => {
      journalEntry.setFlag(systemId, extraCssClasses, classes);
    },
    [journalEntry],
  );

  return (
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
          <AsyncTextInput
            value={journalEntry.name ?? ""}
            onChange={handleTitleChange}
          />
          <AsyncTextInput
            placeholder="Journal CSS Classes"
            value={globalClasses}
            onChange={handleGlobalClassesChange}
          />
        </div>
        <div
          css={{ display: "flex", flexDirection: "row", gap: "0.5em", flex: 1 }}
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
            {activePageId !== null && journalEntry.pages.has(activePageId) ? (
              <PageEditor page={journalEntry.pages.get(activePageId)} />
            ) : (
              <NoPageSelected />
            )}
          </div>
        </div>
      </CSSReset>
    </MagicToolbarProvider>
  );
};

JournalEditorSheet.displayName = "JournalEditorSheet";
