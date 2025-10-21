import MonacoEditor, { Monaco, OnMount } from "@monaco-editor/react";
import { JSONValue } from "fvtt-types/utils";
import htmlParser from "prettier/plugins/html";
import prettier from "prettier/standalone";
import { useCallback, useMemo, useRef } from "react";
import { AiOutlineFormatPainter } from "react-icons/ai";

import { extraCssClasses, systemId } from "../../constants";
import { debounce, systemLogger } from "../../functions/utilities";
import { TextEditor } from "../../fvtt-exports";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
// these imports are going around the barrel export because I was getting some
// weird "SyntaxError: Ambiguous import "DocumentMemory"" errors
import type { DocumentMemory } from "./documentMemory/types";
import { useToolbarContent } from "./magicToolbar";
import { ToolbarButton } from "./magicToolbar/ToolbarButton";
import { savePage } from "./savePage";

interface HTMLEditorProps {
  page: any;
}
type IStandalonCodeEditor = Parameters<OnMount>[0];

const SAVE_DEBOUNCE_MS = 600;

// burgled from Foundry: resources/app/client/ui/editor.js
function getDragEventData(event: DragEvent): object | null {
  // Clumsy because (event instanceof DragEvent) doesn't work
  if (!("dataTransfer" in event) || event.dataTransfer === null) {
    throw new Error("Incorrectly attempted to process drag event data.");
  }

  try {
    return JSON.parse(event.dataTransfer.getData("text/plain"));
  } catch {
    return null;
  }
}

/**
 * The actual Monaco-based HTML editor.
 */
export const HTMLEditor = ({ page }: HTMLEditorProps) => {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<IStandalonCodeEditor | null>(null);

  const doFormat = useCallback(async () => {
    try {
      await editorRef.current?.getAction("editor.action.formatDocument")?.run();
    } catch (e: any) {
      ui.notifications?.error(`<pre>${e.message}<pre>`);
    }
  }, []);

  const memoryRef = useRef<DocumentMemory | undefined>(undefined);

  // a debounced save function
  const handleSaveContent = useMemo(
    () =>
      // false positive
      // eslint-disable-next-line react-hooks/refs
      debounce(async (content: string) => {
        memoryRef.current = await savePage(page, content, memoryRef.current);
      }, SAVE_DEBOUNCE_MS),
    [page],
  );

  // event handler
  const handleChange = useCallback(
    (content: string | undefined) => {
      if (content !== undefined) {
        handleSaveContent(content);
      }
    },
    [handleSaveContent],
  );

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      monacoRef.current = monaco;
      editorRef.current = editor;

      // @ts-expect-error onDropIntoEditor isn't actually public yet but it does
      // exist. See https://github.com/microsoft/monaco-editor/issues/3359
      editor.onDropIntoEditor(async ({ position, event }: any) => {
        event.preventDefault();
        // const dataTransfer = event.dataTransfer as DataTransfer;
        // return JSON.parse(event.dataTransfer.getData("text/plain"));

        // set the text to the dataTransfer.getData("text/plain") value
        // dataTransfer.setData("text/plain", "foo");
        systemLogger.log("onDropIntoEditor", event);
        const dragData = getDragEventData(event);
        systemLogger.log("dragData", dragData);

        const options = {
          relativeTo: page,
        };

        const text =
          dragData === null
            ? ""
            : await TextEditor.getContentLink(dragData as JSONValue, options);

        if (text) {
          editor.executeEdits("", [
            {
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column,
              ),
              text,
              forceMoveMarkers: true,
            },
          ]);
          editor.focus();
          throw new Error("foo");
        }
      });

      // disable built-in html formatting
      monaco.languages.html.htmlDefaults.setModeConfiguration({
        ...monaco.languages.html.htmlDefaults.modeConfiguration,
        documentFormattingEdits: false,
        documentRangeFormattingEdits: false,
      });
      // use prettier to format html
      monaco.languages.registerDocumentFormattingEditProvider("html", {
        async provideDocumentFormattingEdits(model) {
          try {
            const text1 = await prettier.format(model.getValue(), {
              parser: "html",
              htmlWhitespaceSensitivity: "css",
              plugins: [htmlParser],
            });
            return [
              {
                range: model.getFullModelRange(),
                text: text1,
              },
            ];
          } catch (e: any) {
            ui.notifications?.error(e.message);
          }
        },
      });

      // editor.
    },
    [page],
  );

  const handleFormat = useCallback(async () => {
    await doFormat();
  }, [doFormat]);

  useToolbarContent(
    "HTML",
    useMemo(
      () => (
        <ToolbarButton
          onClick={handleFormat}
          text="Format"
          icon={AiOutlineFormatPainter}
        />
      ),
      [handleFormat],
    ),
  );

  const htmlClasses = page.flags[systemId]?.[extraCssClasses] ?? "";

  const handleChangeClasses = useCallback(
    (classes: string) => {
      page.setFlag(systemId, extraCssClasses, classes);
    },
    [page],
  );

  return (
    <div
      data-testid="html-editor"
      css={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.5em",
      }}
    >
      <div data-testid="html-classes">
        <AsyncTextInput
          value={htmlClasses}
          onChange={handleChangeClasses}
          placeholder="Page CSS Classes"
        />
      </div>

      <div css={{ position: "relative", flex: 1 }}>
        <MonacoEditor
          key={page.id}
          height="100%"
          width="100%"
          defaultLanguage="html"
          defaultValue={page.text.content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          onChange={handleChange}
          options={{
            dropIntoEditor: {
              enabled: true,
              showDropSelector: "afterDrop",
            },
            language: "html",
            automaticLayout: true,
            scrollbar: {
              horizontal: "visible",
            },
            wordWrap: "off",
            rulers: [80],
            unicodeHighlight: {
              ambiguousCharacters: false,
            },
          }}
        />
      </div>
    </div>
  );
};

HTMLEditor.displayName = "MonacoWrapper";
