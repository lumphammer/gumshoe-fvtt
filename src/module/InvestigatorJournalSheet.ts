import { nanoid } from "nanoid";

import { extraCssClasses, systemId } from "../constants";
import { assertGame } from "../functions/utilities";

const editButtonCssClass = "investigator-edit-button";

export class InvestigatorJournalSheet extends JournalSheet {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes.push("investigator");
    return options;
  }

  /** @override */
  activateListeners(html: JQuery) {
    assertGame(game);
    super.activateListeners(html);

    // find the entry content element and add the journal entry's classes onto
    // it
    const journalEntryContentElement = this.element.find(
      ".journal-entry-content",
    );
    const journalEntryClasses =
      this.document.flags[systemId]?.[extraCssClasses] ?? "";
    journalEntryContentElement.addClass(journalEntryClasses);

    // find the page element, work out which page is active, and add the page's
    // classes onto it
    const contentElement = this.element.find(".journal-entry-page");
    const pages = this.document.pages.contents.toSorted(
      (a, b) => a.sort - b.sort,
    );
    const page = pages[this._getCurrentPage()];
    const pageClasses = page?.flags[systemId]?.[extraCssClasses] ?? "";
    if (pageClasses !== undefined) {
      contentElement.addClass(pageClasses);
    }

    // destroy the .edit-container
    this.element.find(".edit-container").remove();

    const canEdit =
      game.user && this.document.canUserModify(game.user, "update");

    // add edit button in titlebar
    if (canEdit && this.element.find(`.${editButtonCssClass}`).length === 0) {
      const id = `investigator_export_${nanoid()}`;
      this.element
        .find("header.window-header a.close")
        .before(
          `<a class="${editButtonCssClass}"id="${id}"><i class="fas fa-code"></i>Edit</a>`,
        );
      document.querySelector(`#${id}`)?.addEventListener("click", () => {
        const EditSheet: JournalSheet = Journal.registeredSheets.find(
          // @ts-expect-error Journal types are effed
          (sheet) => sheet.name === "JournalEditorSheetClass",
        ) as unknown as JournalSheet;
        // @ts-expect-error Journal types are effed
        new EditSheet(this.document).render(true);
      });
    }
  }
}
