import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

export const useItemSheetContext = () => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useItemSheetContext must be used within a FoundryAppContext",
    );
  }
  if (
    !(
      app instanceof ItemSheet ||
      app instanceof foundry.applications.sheets.ItemSheetV2
    )
  ) {
    throw new Error("useItemSheetContext must be used within an ItemSheet");
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
  if (
    !(
      app instanceof ActorSheet ||
      app instanceof foundry.applications.sheets.ActorSheetV2
    )
  ) {
    throw new Error("useActorSheetContext must be used within an ActorSheet");
  }
  const actor = app.document;

  return { app, actor };
};

export const useJournalSheetContext = () => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useJournalSheetContext must be used within a FoundryAppContext",
    );
  }
  if (!(app instanceof JournalSheet)) {
    throw new Error(
      "useJournalSheetContext must be used within a JournalSheet",
    );
  }
  const journalEntry = app.document as JournalEntry;

  return { app, journalEntry };
};

export const useDocumentSheetContext = (docClass?: any) => {
  const app = useContext(FoundryAppContext);
  if (app === null) {
    throw new Error(
      "useDocumentSheetContext must be used within a FoundryAppContext",
    );
  }
  if (
    !(
      app instanceof DocumentSheet ||
      app instanceof foundry.applications.api.DocumentSheetV2
    )
  ) {
    throw new Error(
      "useDocumentSheetContext must be used within an ActorSheet or ItemSheet",
    );
  }
  const doc = app.document;

  return { app, doc };
};
