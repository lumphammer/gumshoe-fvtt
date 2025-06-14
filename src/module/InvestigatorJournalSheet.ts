import { DeepPartial } from "fvtt-types/utils";

import { extraCssClasses, systemId } from "../constants";
import { assertGame } from "../functions/isGame";
import { JournalEntrySheet } from "../fvtt-exports";
import { JournalEntryHTMLEditorSheetClass } from "./JournalEditorSheetClass";

type OnRenderArgs = Parameters<JournalEntrySheet["_onRender"]>;
type ContextArg = OnRenderArgs[0];
type OptionsArg = OnRenderArgs[1];

export class InvestigatorJournalSheet extends JournalEntrySheet {
  static DEFAULT_OPTIONS = {
    classes: [
      ...(JournalEntrySheet.DEFAULT_OPTIONS.classes ?? []),
      "investigator",
    ],
    actions: {
      edit(this: InvestigatorJournalSheet, event: MouseEvent) {
        event.stopPropagation(); // Don't trigger other events
        if (event.detail > 1) return; // Ignore repeated clicks
        ui.notifications?.info("Edit");
        const canEdit =
          game.user && this.document?.canUserModify?.(game.user, "update");

        if (canEdit) {
          void new JournalEntryHTMLEditorSheetClass({
            document: this.document,
          }).render({
            force: true,
          });
        }
      },
    },
    window: {
      resizable: true,
    },
  };

  constructor(options: DeepPartial<JournalEntrySheet.Configuration>) {
    const canEdit =
      game.user && options.document?.canUserModify?.(game.user, "update");

    if (canEdit) {
      options = {
        ...options,
        window: {
          ...options?.window,
          controls: [
            ...(options?.window?.controls ?? []),
            {
              icon: "fa-solid fa-pencil",
              label: "investigator.Edit",
              action: "edit",
              visible: true,
            },
          ],
        },
      };
    }

    super(options);
  }

  /** @override */
  override async _onRender(
    context: ContextArg,
    options: OptionsArg,
  ): Promise<void> {
    assertGame(game);
    await super._onRender(context, options);

    // find the entry content element and add the journal entry's classes onto
    // it
    const journalEntryContentElement = this.element.querySelector(
      ".journal-entry-content",
    );
    if (!journalEntryContentElement) {
      throw new Error("Journal entry content element not found");
    }
    const journalEntryClasses =
      this.document.flags[systemId]?.[extraCssClasses] ?? "";
    if (journalEntryClasses !== undefined && journalEntryClasses !== "") {
      journalEntryContentElement.classList.add(journalEntryClasses);
    }

    // find the page element, work out which page is active, and add the page's
    // classes onto it
    const contentElement = this.element.querySelector(".journal-entry-page");
    const pages = this.document.pages.contents.toSorted(
      (a, b) => a.sort - b.sort,
    );
    // @ts-expect-error pageIndex is not typed
    const page = pages[this.pageIndex];
    const pageClasses = page?.flags[systemId]?.[extraCssClasses] ?? "";
    if (pageClasses !== undefined && pageClasses !== "") {
      contentElement?.classList.add(pageClasses);
    }

    // destroy the .edit-container
    const editContainer = this.element.querySelector(".edit-container");
    if (editContainer) {
      editContainer.remove();
    } else {
      throw new Error("Edit container not found");
    }
  }
}
