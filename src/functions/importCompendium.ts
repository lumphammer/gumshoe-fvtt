import { nanoid } from "nanoid";

import { RecursivePartial } from "../types";
import { assertGame } from "./isGame";
import { systemLogger } from "./utilities";

export type ExportedCompendium = {
  name: string;
  label: string;
  entity: "Item" | "Actor" | "JournalEntry";
  contents: any[];
};

export type ImportCandidate = RecursivePartial<ExportedCompendium>;

function assertIsImportCandidate(
  candidate: unknown,
): asserts candidate is ImportCandidate {
  if (!(typeof candidate === "object") || candidate === null) {
    throw new Error("Candidate compendium was not an object");
  }
}

export const importCompendium = async (candidate: unknown) => {
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
  const pack =
    // @ts-expect-error .create
    await CompendiumCollection.createCompendium<CompendiumCollection.Metadata>(
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

  pack.apps.forEach((app) => app.render(true));

  ui.notifications?.info(
    `Finished importing compendium pack ${verified.label}`,
  );
};
