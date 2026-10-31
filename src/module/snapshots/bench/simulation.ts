import fs from "fs";

import type { FoundryHelpers } from "./foundryHelpers";
import type {
  ActorSource,
  Change,
  EmbeddedSource,
  ItemSource,
} from "./strategies";

export function loadFixture(): ActorSource {
  const url = new URL("./pc.fixture.json", import.meta.url);
  return JSON.parse(fs.readFileSync(url, "utf8"));
}

/** The fixture with its items repeated `times` times, under new ids. */
export function enlargeFixture(actor: ActorSource, times: number): ActorSource {
  const items = Array.from({ length: times }, (_, n) =>
    actor.items.map((item) => ({
      ...structuredClone(item),
      _id: n === 0 ? item._id : `${item._id.slice(0, 13)}~${n}`,
    })),
  ).flat();
  return { ...structuredClone(actor), items };
}

export function applyToLive(
  live: ActorSource,
  change: Change,
  { mergeObject, deepClone }: FoundryHelpers,
) {
  const ops = { applyOperators: true };
  if (change.kind === "updateActor") {
    mergeObject(live, deepClone(change.diff), ops);
    return;
  }
  const docs: EmbeddedSource[] = live[change.collection];
  if (change.kind === "updateEmbedded") {
    const doc = docs.find((d) => d._id === change.diff._id);
    if (doc) mergeObject(doc, deepClone(change.diff), ops);
  } else if (change.kind === "createEmbedded") {
    docs.push(deepClone(change.source));
  } else {
    const index = docs.findIndex((d) => d._id === change.id);
    if (index !== -1) docs.splice(index, 1);
  }
}

let clock = 1_800_000_000_000;
const stats = () => ({ _stats: { modifiedTime: clock++ } });

export const changes = {
  actorResource: (actor: ActorSource, value: number): Change => ({
    kind: "updateActor",
    diff: {
      _id: actor._id,
      system: { resources: { health: { value } } },
      ...stats(),
    },
  }),
  actorLongNote: (actor: ActorSource, text: string): Change => ({
    kind: "updateActor",
    diff: {
      _id: actor._id,
      system: { longNotes: [`<p>${text}</p>`] },
      ...stats(),
    },
  }),
  actorFlag: (actor: ActorSource, value: unknown): Change => ({
    kind: "updateActor",
    diff: { _id: actor._id, flags: { investigator: { bench: value } } },
  }),
  itemPool: (item: ItemSource, pool: number): Change => ({
    kind: "updateEmbedded",
    collection: "items",
    diff: { _id: item._id, system: { pool }, ...stats() },
  }),
  createItem: (template: ItemSource, id: string): Change => ({
    kind: "createEmbedded",
    collection: "items",
    source: { ...structuredClone(template), _id: id },
  }),
  deleteItem: (id: string): Change => ({
    kind: "deleteEmbedded",
    collection: "items",
    id,
  }),
};
