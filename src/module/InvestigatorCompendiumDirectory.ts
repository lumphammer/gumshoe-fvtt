import { assertGame } from "../functions/isGame";
import { CompendiumCollection } from "../fvtt-exports";
import CompendiumDirectory = foundry.applications.sidebar.tabs.CompendiumDirectory;

import { nanoid } from "nanoid";

import { saveAsJsonFile } from "../functions/saveFile";
import { getUserFile, systemLogger } from "../functions/utilities";
import { RecursivePartial } from "../types";

const importButtonIconClass = "fa-cloud-arrow-up";
const importButtonSpinnerClasses = ["fa-spinner", "fa-pulse"];

type ExportedCompendium = {
  name: string;
  label: string;
  entity: "Item" | "Actor" | "JournalEntry";
  contents: any[];
};

function assertIsImportCandidate(
  candidate: unknown,
): asserts candidate is RecursivePartial<ExportedCompendium> {
  if (!(typeof candidate === "object") || candidate === null) {
    throw new Error("Candidate compendium was not an object");
  }
}

/**
 * Replacement for the CompendiumDirectory class to enable compendium export /
 * import
 */
export class InvestigatorCompendiumDirectory extends CompendiumDirectory {
  override _replaceHTML(
    ...args: Parameters<CompendiumDirectory["_replaceHTML"]>
  ) {
    super._replaceHTML(...args);
    assertGame(game);
    if (
      this.element.querySelector(".directory-header .import-file-picker") !==
      null
    ) {
      return;
    }
    const text = game.i18n.localize("investigator.ImportFromFile");
    const content = `<div class="header-actions action-buttons flexrow import-file-picker">
        <button class="import-compendium" type="submit">
          <i class="fas ${importButtonIconClass}"></i> ${text}
        </button>
    </div>`;
    const tmpDiv = document.createElement("div");
    tmpDiv.innerHTML = content;
    const div = tmpDiv.childNodes[0];
    if (!(div instanceof HTMLDivElement)) {
      throw new Error("wtf");
    }
    const icon = div.querySelector("i");
    if (icon === null) {
      throw new Error("wtf");
    }
    div
      .querySelector("button")
      ?.addEventListener("click", this.#onClickImport.bind(this, icon));
    this.element.querySelector(".directory-header")?.append(div);
  }

  /**
   * Get context menu entries for entries in this directory.
   */
  override _getEntryContextOptions(): foundry.applications.ux.ContextMenu.Entry<HTMLElement>[] {
    assertGame(game);
    if (!game.user.isGM) return [];
    const initial = super._getEntryContextOptions();

    const exportButton: foundry.applications.ux.ContextMenu.Entry<HTMLElement> =
      {
        name: "investigator.ExportToFile",
        icon: '<i class="fa-solid fa-cloud-arrow-down"></i>',
        callback: this.#onExportCompendiumPack.bind(this),
        condition: this.#isPackValidForExport.bind(this),
      };

    const result = [...initial, exportButton];
    return result;
  }

  /**
   * Get the compendium pack from an element.
   *
   * @param element - The element to get the compendium pack from.
   * @returns The compendium pack.
   */
  #getPackFromElement(element: HTMLElement) {
    assertGame(game);
    const dirItem = element.closest(".directory-item");
    if (!(dirItem instanceof HTMLElement)) {
      throw new Error(
        "directory item element not found or not an HTML element",
      );
    }
    const packId = dirItem.dataset["pack"];
    if (packId === undefined) {
      throw new Error("Entry ID not found on element");
    }
    const pack = game.packs.get(packId);
    if (pack === undefined) {
      throw new Error("Pack not found");
    }
    return pack;
  }

  /**
   * Handler for the import button in the compendium directory.
   *
   * @param icon - The icon element to update.
   */
  async #onClickImport(icon: HTMLElement) {
    icon.classList.remove(importButtonIconClass);
    icon.classList.add(...importButtonSpinnerClasses);
    try {
      const text = await getUserFile(".json");
      await this.#importCompendium(JSON.parse(text));
    } catch (e: any) {
      ui.notifications?.error(`Compendium pack import failed: ${e.message}`, {
        permanent: true,
      });
    } finally {
      icon.classList.remove(...importButtonSpinnerClasses);
      icon.classList.add(importButtonIconClass);
    }
  }

  /**
   * Check if a compendium pack is valid for export.
   *
   * @param element - The element to check.
   * @returns True if the compendium pack is valid for export, false otherwise.
   */
  #isPackValidForExport(element: HTMLElement) {
    const pack = this.#getPackFromElement(element);
    const packType = pack.metadata.type;
    return (
      packType === "Item" || packType === "Actor" || packType === "JournalEntry"
    );
  }

  /**
   * Handler for the export button in the compendium directory.
   *
   * @param element - The element to export.
   */
  async #onExportCompendiumPack(element: HTMLElement) {
    assertGame(game);

    const pack = this.#getPackFromElement(element);
    const packType = pack.metadata.type;
    if (
      packType !== "Item" &&
      packType !== "Actor" &&
      packType !== "JournalEntry"
    ) {
      throw new Error("Pack type not supported");
    }
    const contents = await pack.getDocuments();
    const mapped = contents.map((document) => ({
      name: document.name,
      type: "type" in document ? document.type : undefined,
      img: "img" in document ? document.img : undefined,
      system: document.system,
      pages: "pages" in document ? document.pages : undefined,
      flags: document.flags,
    }));
    const exportData: ExportedCompendium = {
      label: pack.metadata.label,
      name: pack.metadata.name,
      entity: packType,
      contents: mapped,
    };
    saveAsJsonFile(exportData, pack.metadata.name);
  }

  /**
   * Given an unknown blob of data, attempt to import it as a compendium pack.
   *
   * @param candidate - The unknown blob of data to import.
   */
  async #importCompendium(candidate: unknown) {
    assertGame(game);
    assertIsImportCandidate(candidate);
    if (candidate.name === undefined) {
      throw new Error("Candidate compendium did not contain a name");
    }
    if (candidate.label === undefined) {
      throw new Error("Candidate compendium did not contain a label");
    }
    if (candidate.entity === undefined) {
      throw new Error("Candidate compendium did not contain an entity");
    }
    if (
      candidate.contents === undefined ||
      candidate.contents.length === undefined
    ) {
      throw new Error("Candidate compendium did not contain any contents");
    }
    const verified = candidate as ExportedCompendium;
    const name = `${verified.name}-${nanoid()}`;
    ui.notifications?.info(
      `Beginning import of compendium pack ${verified.label}`,
    );
    const pack = await CompendiumCollection.createCompendium(
      {
        type: verified.entity,
        label: verified.label,
        name,
      },
      { broadcast: false, data: [] },
    );
    const maker = {
      Actor,
      Item,
      JournalEntry,
    }[verified.entity];

    const entities = await maker.create(verified.contents as any, {
      temporary: true,
    });
    for (const entity of entities as any) {
      await pack.importDocument(entity);
      systemLogger.log(
        `Imported ${verified.entity} ${entity.name} into Compendium pack ${pack.collection}`,
      );
    }

    pack.apps.forEach((app) =>
      app instanceof foundry.appv1.api.Application
        ? app.render(true)
        : app.render({ force: true }),
    );

    ui.notifications?.info(
      `Finished importing compendium pack ${verified.label}`,
    );
  }
}
