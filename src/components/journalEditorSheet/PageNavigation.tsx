import React, { useMemo } from "react";
import { BsImage } from "react-icons/bs";
import { FaBarsStaggered, FaImage } from "react-icons/fa6";
import { VscOutput } from "react-icons/vsc";

import { useTheme } from "../../hooks/useTheme";
import { absoluteCover } from "../absoluteCover";
import { useToolbarContent } from "./magicToolbar";
// import { useTheme } from "../../hooks/useTheme";
import { ToolbarButton } from "./magicToolbar/ToolbarButton";

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
    // @ts-expect-error the journal types are so fucked
    Math.max(0, ...journalEntry.pages.contents.map((p) => p.sort)) +
    CONST.SORT_INTEGER_DENSITY;
  const nameRegex = new RegExp(`^${name}\\s+(\\d+)$`, "i");
  // @ts-expect-error urrrrrgh
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
export const PageNavigation: React.FC<PageNavigationProps> = ({
  journalEntry,
  onNavigate,
  activePageId,
}) => {
  const theme = useTheme();

  const pages = Array.from(journalEntry.pages.values()).sort((a, b) => {
    return a.sort - b.sort;
  });

  const handlePageClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const pageId = event.currentTarget.dataset.pageid;
      if (pageId !== undefined) {
        onNavigate(pageId);
      }
    },
    [onNavigate],
  );

  const handleAddNewTextPage = React.useCallback(async () => {
    const newPage = await addPage(journalEntry, "text", "New page");
    // @ts-expect-error ???
    onNavigate(newPage[0]._id);
  }, [journalEntry, onNavigate]);

  const handleAddNewImagePage = React.useCallback(async () => {
    const newPage = await addPage(journalEntry, "image", "New image");
    // @ts-expect-error ???
    onNavigate(newPage[0]._id);
  }, [journalEntry, onNavigate]);

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

  return (
    <div
      css={{
        ...absoluteCover,
        padding: "1px",
        overflowY: "auto",
        flex: 1,
        backgroundColor: theme.colors.backgroundPrimary,
        border: `1px solid ${theme.colors.accent}`,
        // borderBottom: `1px solid ${theme.colors.accent}`,
      }}
    >
      {pages.map((page) => {
        return (
          <a
            data-pageid={page.id}
            key={page.id}
            onClick={handlePageClick}
            css={{
              textAlign: "left",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              padding: "0.5em",
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
              backgroundColor:
                page.id === activePageId
                  ? theme.colors.backgroundButton
                  : "transparent",
              border: "1px solid transparent",
              marginLeft: `${(page.title.level - 1) * 1.5}em`,
              "&:hover": {
                border: `1px solid ${theme.colors.accent}`,
              },
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
        );
      })}
    </div>
  );
};

PageNavigation.displayName = "PageNavigation";
