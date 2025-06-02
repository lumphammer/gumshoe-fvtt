import { ReactApplicationV2Mixin } from "@lumphammer/shared-fvtt-bits/src/ReactApplicationV2Mixin";
import { lazy } from "react";

import { Suspense } from "../components/Suspense";
import { systemId } from "../constants";
import { JournalEntrySheet } from "../fvtt-exports";

const JournalEditorSheet = lazy(() =>
  import("../components/journalEditorSheet/JournalEditorSheet").then(
    ({ JournalEditorSheet }) => ({
      default: JournalEditorSheet,
    }),
  ),
);

export class JournalEntryHTMLEditorSheetClassBase extends JournalEntrySheet {
  static DEFAULT_OPTIONS = {
    classes: [systemId, "sheet", "actor"],
    window: {
      resizable: true,
    },
    position: {
      width: 1230,
      // height: 900,
    },
  };

  // block the parent class's attempts to render a page - we're dealing with
  // all that in React
  // @ts-expect-error not typed yet
  override async _renderPageViews() {
    // return super._renderPageViews();
  }
}

const render = () => {
  return (
    <Suspense>
      <JournalEditorSheet />
    </Suspense>
  );
};

export const JournalEntryHTMLEditorSheetClass = ReactApplicationV2Mixin(
  "JournalEntryHTMLEditorSheetClass",
  JournalEntryHTMLEditorSheetClassBase,
  render,
);
