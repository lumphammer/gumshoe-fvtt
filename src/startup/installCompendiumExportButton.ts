import { nanoid } from "nanoid";

import {
  ExportedCompendium,
  importCompendium,
} from "../functions/importCompendium";
import { saveAsJsonFile } from "../functions/saveFile";
import { assertGame, getUserFile } from "../functions/utilities";

import AbstractSidebarTab = foundry.applications.sidebar.AbstractSidebarTab;

const importButtonIconClass = "fa-cloud-upload-alt";
const importButtonSpinnerClass = "fa-spinner fa-pulse";

export const installCompendiumExportButton = () => {
  // Add the "export" button when rendering a Compendium window
  Hooks.on("renderCompendium", (app: any, jQ: JQuery, data: any) => {
    const entity = app.collection.metadata.type;
    if (
      !(entity === "Item" || entity === "Actor" || entity === "JournalEntry")
    ) {
      return;
    }
    const id = `investigator_export_${nanoid()}`;
    jQ.find("header.window-header a.close").before(
      `<a id="${id}"><i class="fas fa-cloud-download-alt"></i>Export</a>`,
    );
    document.querySelector(`#${id}`)?.addEventListener("click", async () => {
      assertGame(game);
      await app.getData();
      // what a pavlova just to get the contents of the pack - surely there's
      // a more direct way?
      const contents =
        (await game.packs.get(app.collection.collection)?.getDocuments()) ?? [];
      const mapped = contents.map(
        ({ name, type, img, system, pages, flags }: any) => ({
          name,
          type,
          img,
          system,
          pages,
          flags,
        }),
      );
      const exportData: ExportedCompendium = {
        label: app.collection.metadata.label,
        name: app.collection.metadata.name,
        entity,
        contents: mapped,
      };
      saveAsJsonFile(exportData, data.collection.metadata.name);
    });
  });

  const insertImportButton = (app: AbstractSidebarTab) => {
    if (app.tabName !== "compendium") {
      return;
    }
    app.element
      .querySelector(".directory-header .import-file-picker")
      ?.remove();
    const id = `file-picker-button-${nanoid()}`;
    const content = `<div class="header-actions action-buttons flexrow import-file-picker">
        <Button id="${id}" class="import-compendium" type="submit">
          <i class="fas ${importButtonIconClass}"></i> Import From JSON File
        </Button>
    </div>`;
    app.element.querySelector(".directory-header")?.append(content);
    document.querySelector(`#${id}`)?.addEventListener("click", async () => {
      $(`#${id} i`)
        .removeClass(importButtonIconClass)
        .addClass(importButtonSpinnerClass);
      try {
        const text = await getUserFile(".json");
        await importCompendium(JSON.parse(text));
      } catch (e: any) {
        ui.notifications?.error(`Compendium pack import failed: ${e.message}`, {
          permanent: true,
        });
      } finally {
        $(`#${id} i`)
          .removeClass(importButtonSpinnerClass)
          .addClass(importButtonIconClass);
      }
    });
  };

  // add the "import" button when
  Hooks.on("changeSidebarTab", (app: AbstractSidebarTab) => {
    insertImportButton(app);
  });

  Hooks.on(
    "renderSidebarTab",
    (app: AbstractSidebarTab, fuckNose: unknown, other: unknown) => {
      insertImportButton(app);
    },
  );
};
