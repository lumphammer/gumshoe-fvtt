import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import {
  ActorSheetV2,
  Document,
  DocumentSheetV2,
  ItemSheetV2,
  JournalEntrySheet,
} from "../fvtt-exports";
import { InvestigatorActor } from "../module/actors/InvestigatorActor";

export const useItemSheetContext = () => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useItemSheetContext must be used within a FoundryAppContext",
    );
  }
  if (!(app instanceof ItemSheetV2)) {
    throw new Error("useItemSheetContext must be used within an ItemSheetV2");
  }
  const item = app.item;

  return { app, item };
};

export const useActorSheetContext = () => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useActorSheetContext must be used within a FoundryAppContext",
    );
  }
  if (!(app instanceof ActorSheetV2)) {
    throw new Error("useActorSheetContext must be used within an ActorSheetV2");
  }
  const actor: InvestigatorActor = app.document;

  return { app, actor };
};

export const useJournalEntrySheetContext = () => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useJournalEntrySheetContext must be used within a FoundryAppContext",
    );
  }
  if (!(app instanceof JournalEntrySheet)) {
    throw new Error(
      "useJournalSheetContext must be used within a JournalSheet",
    );
  }
  const journalEntry = app.document;

  return { app, journalEntry };
};

export const useDocumentSheetContext = () => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useDocumentSheetContext must be used within a FoundryAppContext",
    );
  }
  if (!(app instanceof DocumentSheetV2)) {
    throw new Error(
      "useDocumentSheetContext must be used within a DocumentSheetV2",
    );
  }
  if (!(app.document instanceof Document)) {
    throw new Error(
      "useDocumentSheetContext must be used within a DocumentSheetV2",
    );
  }
  const doc = app.document;

  return { app, doc };
};
