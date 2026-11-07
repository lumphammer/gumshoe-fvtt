import React, { Fragment, useCallback, useMemo } from "react";
import { BsImage, BsSortNumericDown } from "react-icons/bs";
import { FaBarsStaggered, FaImage } from "react-icons/fa6";
import { VscOutput } from "react-icons/vsc";

import { useDragStart } from "../../hooks/useDragStart";
import { useJournalEntrySnapshot } from "../../hooks/useJournalEntrySnapshot";
import { absoluteCover } from "../absoluteCover";
import { useToolbarContent } from "./magicToolbar";
// import { useTheme } from "../../hooks/useTheme";
import { ToolbarButton } from "./magicToolbar/ToolbarButton";
import { richText, row } from "../../styled-system/recipes";

const pageIdDataAttribute = "data-page-id";
const pageIdDatasetName = "pageId";

interface PageNavigationProps {
  journalEntry: JournalEntry;
  onNavigate: (pageId: string) => void;
  activePageId: string | null;
}

/**
 * Adds a new page to the journal entry
 */
async function addPage(
  journalEntry: JournalEntry,
  type: "text" | "image",
  name: string,
) {
  const sort =
    Math.max(0, ...journalEntry.pages.contents.map((p) => p.sort)) +
    CONST.SORT_INTEGER_DENSITY;
  const nameRegex = new RegExp(`^${name}\\s+(\\d+)$`, "i");
  const pages: any[] = journalEntry.pages.contents;
  const pageNumbers = pages
    .map((p) => nameRegex.exec(p.name)?.[1])
    .filter((n) => n && n.length > 0)
    .map(Number);

  const newPageNumber = pageNumbers.length ? Math.max(...pageNumbers) + 1 : 1;

  return await journalEntry.createEmbeddedDocuments(
    "JournalEntryPage",
    [
      {
        type,
        name: `${name} ${newPageNumber}`,
        sort,
      },
    ],
    { renderSheet: false },
  );
}

/**
 * The left-hand page navigation bar for the journal editor
 */
export const PageNavigation = ({
  journalEntry,
  onNavigate,
  activePageId,
}: PageNavigationProps) => {
  // what's shown of each page, in order
  const pages = useJournalEntrySnapshot(journalEntry, (entry) =>
    entry.pages
      .map((page) => ({
        id: page._id,
        name: page.name,
        type: page.type,
        level: page.title.level,
        sort: page.sort,
      }))
      .toSorted((a, b) => a.sort - b.sort),
  );

  const handlePageClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const pageId = event.currentTarget.dataset[pageIdDatasetName];
      if (pageId !== undefined) {
        onNavigate(pageId);
      }
    },
    [onNavigate],
  );

  const handleDragStart = useDragStart();

  const handleAddNewTextPage = useCallback(async () => {
    const newPage = await addPage(journalEntry, "text", "New page");
    if (newPage && newPage[0].id) {
      onNavigate(newPage[0].id);
    }
  }, [journalEntry, onNavigate]);

  const handleAddNewImagePage = useCallback(async () => {
    const newPage = await addPage(journalEntry, "image", "New image");
    if (newPage && newPage[0].id) {
      onNavigate(newPage[0].id);
    }
  }, [journalEntry, onNavigate]);

  const handleRenumberPages = useCallback(async () => {
    const pages = journalEntry.pages.contents.toSorted(
      (a: any, b: any) => a.sort - b.sort,
    );
    const updates = pages.map((page: any, i: number) => {
      return {
        _id: page.id,
        sort: (i + 1) * 1000,
      };
    });
    await journalEntry.updateEmbeddedDocuments("JournalEntryPage", updates);
    ui.notifications?.info(`Renumbered ${pages.length} pages`);
  }, [journalEntry]);

  useToolbarContent(
    "Create new",
    useMemo(
      () => (
        <>
          <ToolbarButton
            onClick={handleAddNewTextPage}
            icon={VscOutput}
            text="Text"
          />
          <ToolbarButton
            onClick={handleAddNewImagePage}
            icon={BsImage}
            text="Image"
          />
        </>
      ),
      [handleAddNewImagePage, handleAddNewTextPage],
    ),
  );

  useToolbarContent(
    "Core",
    useMemo(
      () => (
        <>
          <ToolbarButton
            onClick={handleRenumberPages}
            icon={BsSortNumericDown}
            text="Renumber"
          />
        </>
      ),
      [handleRenumberPages],
    ),
  );

  return (
    <div
      className={richText()}
      css={{
        ...absoluteCover,
        padding: "1px",
        overflowY: "auto",
        flex: 1,
      }}
    >
      {pages.map((page) => {
        return (
          // for some reason putting the key on <a> directly causes a key warning
          <Fragment key={page.id}>
            <a
              {...{ [pageIdDataAttribute]: page.id }}
              onClick={handlePageClick}
              onDragStart={handleDragStart}
              draggable
              aria-current={page.id === activePageId ? "page" : undefined}
              className={row({ interactive: true })}
              css={{
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
                padding: "0.5em",
                marginLeft: `${(page.level - 1) * 1.5}em`,
              }}
            >
              <span
                css={{
                  display: "inline-block",
                  width: "2em",
                  verticalAlign: "baseline",
                }}
              >
                {page.type === "text" ? <FaBarsStaggered /> : <FaImage />}
              </span>
              {page.name}
            </a>
          </Fragment>
        );
      })}
    </div>
  );
};

PageNavigation.displayName = "PageNavigation";
