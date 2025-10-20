import { useCallback, useMemo } from "react";
import { AiOutlineArrowDown, AiOutlineArrowUp } from "react-icons/ai";
import { BsIndent, BsTrash, BsUnindent } from "react-icons/bs";

import { confirmADoodleDo } from "../../functions/confirmADoodleDo";
import { systemLogger } from "../../functions/utilities";
import { useRefStash } from "../../hooks/useRefStash";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { HTMLPage } from "./HTMLPage";
import { ImageEditor } from "./ImageEditor";
import { ToolbarButton, useToolbarContent } from "./magicToolbar";
import { UnknownPageTypeEditor } from "./UnknownPageTypeEditor";

const MAX_INDENT = 3;
const MIN_INDENT = 1;

interface PageEditorProps {
  page: any;
}

/**
 * Handles the edit area for any page. Delegates to the appropriate editor for
 * the content type.
 */
export const PageEditor = ({ page }: PageEditorProps) => {
  // optimize toolbar rendering by putting page in a ref so the callbacks are
  // all stable
  const pageRef = useRefStash(page);

  const handleDeletePage = useCallback(async () => {
    const page = pageRef.current;
    const doDelete = await confirmADoodleDo({
      message: `Delete page ${page.name}?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa fa-trash",
      resolveFalseOnCancel: true,
      translate: false,
    });
    if (doDelete) {
      await page.parent.deleteEmbeddedDocuments("JournalEntryPage", [page.id]);
    }
  }, [pageRef]);

  const handleMoveUp = useCallback(async () => {
    const page = pageRef.current;
    const pages = page.parent.pages.contents.toSorted((a: any, b: any) => {
      return a.sort - b.sort;
    });
    const thisIndex = pages.findIndex((p: any) => p._id === page._id);
    if (thisIndex < 1) {
      return;
    }
    const prevPage = pages[thisIndex - 1];
    const updates = [
      {
        _id: page.id,
        sort: prevPage.sort,
      },
      {
        _id: prevPage.id,
        sort: page.sort,
      },
    ];
    systemLogger.log("move up", updates);
    await page.parent.updateEmbeddedDocuments("JournalEntryPage", updates);
  }, [pageRef]);

  const handleMoveDown = useCallback(async () => {
    const page = pageRef.current;

    const pages = page.parent.pages.contents.toSorted((a: any, b: any) => {
      return a.sort - b.sort;
    });
    const thisIndex = pages.findIndex((p: any) => p._id === page._id);
    if (thisIndex >= pages.length - 1) {
      return;
    }
    const nextPage = pages[thisIndex + 1];
    const updates = [
      {
        _id: page.id,
        sort: nextPage.sort,
      },
      {
        _id: nextPage.id,
        sort: page.sort,
      },
    ];
    systemLogger.log("move up", updates);
    await page.parent.updateEmbeddedDocuments("JournalEntryPage", updates);
  }, [pageRef]);

  const handleIndent = useCallback(async () => {
    const page = pageRef.current;
    if (page.title.level >= MAX_INDENT) {
      return;
    }
    await page.parent.updateEmbeddedDocuments("JournalEntryPage", [
      {
        _id: page.id,
        title: {
          ...page.title,
          level: page.title.level + 1,
        },
      },
    ]);
  }, [pageRef]);

  const handleOutdent = useCallback(() => {
    const page = pageRef.current;
    if (page.title.level <= MIN_INDENT) {
      return;
    }
    page.parent.updateEmbeddedDocuments("JournalEntryPage", [
      {
        _id: page.id,
        title: {
          ...page.title,
          level: page.title.level - 1,
        },
      },
    ]);
  }, [pageRef]);

  const pages = page.parent.pages.contents.sort((a: any, b: any) => {
    return a.sort - b.sort;
  });
  const thisIndex = pages.findIndex((p: any) => p._id === page._id);

  const canMoveUp = thisIndex > 0;
  const canMoveDown = thisIndex < pages.length - 1;
  const canIndent = page.title.level < MAX_INDENT;
  const canOutdent = page.title.level > MIN_INDENT;

  useToolbarContent(
    "Page",
    useMemo(
      () => (
        <>
          <ToolbarButton
            onClick={handleMoveUp}
            text="Up"
            icon={AiOutlineArrowUp}
            disabled={!canMoveUp}
          />
          <ToolbarButton
            onClick={handleMoveDown}
            text="Down"
            icon={AiOutlineArrowDown}
            disabled={!canMoveDown}
          />
          <ToolbarButton
            onClick={handleIndent}
            text="Indent"
            icon={BsIndent}
            disabled={!canIndent}
          />
          <ToolbarButton
            onClick={handleOutdent}
            text="Outdent"
            icon={BsUnindent}
            disabled={!canOutdent}
          />
          <ToolbarButton
            onClick={handleDeletePage}
            text="Delete"
            icon={BsTrash}
          />
        </>
      ),
      [
        canIndent,
        canMoveDown,
        canMoveUp,
        canOutdent,
        handleDeletePage,
        handleIndent,
        handleMoveDown,
        handleMoveUp,
        handleOutdent,
      ],
    ),
  );

  const handleRename = useCallback(
    async (name: string) => {
      await page.parent.updateEmbeddedDocuments("JournalEntryPage", [
        {
          _id: page.id,
          name,
        },
      ]);
    },
    [page.id, page.parent],
  );

  return (
    <div
      data-testid="editor"
      css={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      }}
    >
      <div data-testid="name">
        <AsyncTextInput value={page.name} onChange={handleRename} />
      </div>
      <div
        data-testid="main-area"
        css={{
          flex: 1,
          position: "relative",
        }}
      >
        {page.type === "image" ? (
          <ImageEditor page={page} key={page.id} />
        ) : page.type === "text" ? (
          <HTMLPage page={page} key={page.id} />
        ) : (
          <UnknownPageTypeEditor page={page} key={page.id} />
        )}
      </div>
    </div>
  );
};

PageEditor.displayName = "PageEditor";
