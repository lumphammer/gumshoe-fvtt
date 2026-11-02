// Snapshot stores for Foundry documents and our settings: the Foundry glue
// for `createSnapshotStore`. Each store copies only the document a hook names
// (from its prepared data), and shares everything else with the previous
// snapshot (see docs/immutable-data.md).

import { systemId } from "../../constants";
import type { SettingsDict } from "../../settings/settings";
import { getSettingsDict } from "../../settings/settings";
import type {
  DeepReadonly,
  OnChange,
  SnapshotStore,
} from "./createSnapshotStore";
import { createSnapshotStore } from "./createSnapshotStore";
import type {
  ActorType,
  ItemType,
  TypedActorData,
  TypedActorSnapshot,
  TypedItemSnapshot,
} from "./snapshotTypes";
import type { HookWatch, Off } from "./hookStores";
import {
  cachedPer,
  createHookStore,
  on,
  onHook,
  once,
  watchHooks,
} from "./hookStores";

/** An item's prepared data (`toObject(false)`), its system data as `TSystem`. */
export type ItemData<TSystem = unknown> = Omit<Item.Source, "system"> & {
  system: TSystem;
};

/** An item's snapshot, typed by item type (any, by default) */
export type ItemSnapshot<T extends ItemType = ItemType> = TypedItemSnapshot<T>;

/** An actor's prepared data, with its items and effects */
export type ActorData = TypedActorData;
/** An actor's snapshot, typed by actor type (any, by default) */
export type ActorSnapshot<T extends ActorType = ActorType> =
  TypedActorSnapshot<T>;

export type SettingsSnapshot = DeepReadonly<SettingsDict>;

/** The hooks for creating, updating and deleting a kind of document */
const lifecycleHooks = (
  documentName: string,
  when: (doc: { parent: unknown }) => boolean,
): HookWatch[] =>
  ["create", "update", "delete"].map((verb) =>
    onHook(
      `${verb}${documentName}` as Hooks.HookName,
      ((doc: { parent: unknown }) => when(doc)) as never,
    ),
  );

// ---------------------------------------------------------------------------
// A document with embedded documents (an actor's items, a journal's pages)

type EmbeddedDoc = { id: string | null; parent: unknown };

/** Which of a parent's embedded documents a store holds, under `key` */
type Collection = {
  /** the documents' name, as in their hooks (`createItem`): "Item" */
  documentName: string;
  /** the parent's documents of this kind, now */
  contents: () => readonly EmbeddedDoc[];
  /** a document's data, as the store holds it (a fresh copy) */
  toData: (doc: never) => unknown;
};

/**
 * Change (or add, or remove) one embedded document in a list, keeping the
 * others as they were. `null` removes it.
 */
export type RefreshEmbedded = (
  key: string,
  id: string | null,
  data: unknown,
) => void;

/**
 * Replace (or add, or remove) one embedded document in a list, keeping the
 * others as they were.
 */
function withDocument<T extends { readonly _id: string | null }>(
  docs: readonly T[],
  id: string,
  doc: T | null,
): T[] {
  const index = docs.findIndex((d) => d._id === id);
  if (doc === null) return docs.filter((d) => d._id !== id);
  return index === -1 ? [...docs, doc] : docs.with(index, doc);
}

/**
 * A store of a document's own data and its embedded documents, which follows
 * changes to any of them. Only the document that changed is copied (and the
 * parent's own data, which can be derived from its embedded documents).
 *
 * @param ownData the parent's own data, without its embedded documents (a
 * fresh copy)
 * @param updateHook the hook for updates to the parent
 * @param collections the embedded documents to hold, by key
 * @param watchMore anything else to follow, given a way to replace one
 * embedded document, and to read everything again
 */
export function createParentStore<TData>(
  parent: unknown,
  {
    ownData,
    updateHook,
    collections,
    watchMore,
  }: {
    ownData: () => object;
    updateHook: Hooks.HookName;
    collections: Record<string, Collection>;
    watchMore?: (refresh: RefreshEmbedded, readAll: () => void) => Off[];
  },
): SnapshotStore<TData> {
  const entries = Object.entries(collections);
  return createSnapshotStore<TData>(
    () =>
      ({
        ...ownData(),
        ...Object.fromEntries(
          entries.map(([key, c]) => [
            key,
            c.contents().map((doc) => c.toData(doc as never)),
          ]),
        ),
      }) as TData,
    (onChange: OnChange<TData>) => {
      const refresh = (
        key: string | null,
        id?: string | null,
        data?: unknown,
      ) =>
        onChange((previous) => {
          const next = {
            ...(previous as Record<string, unknown>),
            ...ownData(),
          };
          if (key !== null && id) {
            next[key] = withDocument(
              previous[key as keyof typeof previous] as readonly {
                _id: string | null;
              }[],
              id,
              (data ?? null) as { _id: string | null } | null,
            );
          }
          return next as TData;
        });
      const isOurs = (doc: { parent: unknown }) => doc.parent === parent;
      const offs: Off[] = [
        on(updateHook, ((doc: unknown) => {
          if (doc === parent) refresh(null);
        }) as Hooks.Function<typeof updateHook>),
      ];
      for (const [key, c] of entries) {
        const onDoc = (deleted: boolean) => (doc: EmbeddedDoc) => {
          if (isOurs(doc)) {
            refresh(key, doc.id, deleted ? null : c.toData(doc as never));
          }
        };
        offs.push(
          on(
            `create${c.documentName}` as Hooks.HookName,
            onDoc(false) as never,
          ),
          on(
            `update${c.documentName}` as Hooks.HookName,
            onDoc(false) as never,
          ),
          on(`delete${c.documentName}` as Hooks.HookName, onDoc(true) as never),
        );
      }
      offs.push(...(watchMore?.(refresh, () => onChange()) ?? []));
      return () => offs.forEach((off) => off());
    },
  );
}

// ---------------------------------------------------------------------------
// Items

const itemData = (item: Item.Implementation) =>
  item.toObject(false) as unknown as ItemData;

/** A store of one item, which follows changes to it and its effects. */
const createItemStore = (item: Item.Implementation) =>
  createHookStore(
    () => itemData(item),
    [
      onHook("updateItem", (doc) => doc === item),
      ...lifecycleHooks("ActiveEffect", (effect) => effect.parent === item),
    ],
  );

const itemStores = cachedPer(createItemStore);

/** The store of an item (see `createItemStore`) */
export function getItemStore<TSystem>(
  item: Item.Implementation,
): SnapshotStore<ItemData<TSystem>> {
  return itemStores(item) as SnapshotStore<ItemData<TSystem>>;
}

// ---------------------------------------------------------------------------
// Actors

/** An actor's own prepared data, without its items and effects. */
function actorOnlyData(actor: Actor.Implementation) {
  const {
    items: _items,
    effects: _effects,
    system: _system,
    ...rest
  } = actor._source;
  const system = actor.system as { toObject?: (source: boolean) => unknown };
  return {
    ...foundry.utils.deepClone(rest),
    system:
      typeof system.toObject === "function"
        ? system.toObject(false)
        : foundry.utils.deepClone(actor.system),
  };
}

/**
 * A store of an actor with its items and effects, which follows changes to
 * any of them (and to its base actor's, for an unlinked token's).
 */
const createActorStore = (actor: Actor.Implementation) =>
  createParentStore<ActorData>(actor, {
    ownData: () => actorOnlyData(actor),
    updateHook: "updateActor",
    collections: {
      items: {
        documentName: "Item",
        contents: () => actor.items.contents,
        toData: itemData,
      },
      effects: {
        documentName: "ActiveEffect",
        contents: () => actor.effects.contents,
        toData: (effect: ActiveEffect.Implementation) => effect.toObject(false),
      },
    },
    watchMore: (refresh, readAll) => {
      // an item's own effect: the item's copy includes it
      const onItemEffect = (effect: ActiveEffect.Implementation) => {
        const item = effect.parent;
        if (item instanceof Item && item.parent === actor) {
          refresh("items", item.id, itemData(item));
        }
      };
      const offs = [
        on("createActiveEffect", onItemEffect),
        on("updateActiveEffect", onItemEffect),
        on("deleteActiveEffect", onItemEffect),
      ];
      // An unlinked token's actor inherits from its base actor: Foundry
      // updates it in place when that changes, without a hook of its own, so
      // read it all again (once Foundry has: hence the microtask)
      const baseActor = actor.isToken ? actor.token?.baseActor : null;
      if (baseActor != null) {
        const isBase = (doc: { parent: unknown }) =>
          doc.parent === baseActor ||
          (doc.parent instanceof Item && doc.parent.parent === baseActor);
        offs.push(
          watchHooks(
            [
              onHook("updateActor", (doc) => doc === baseActor),
              ...lifecycleHooks("Item", isBase),
              ...lifecycleHooks("ActiveEffect", isBase),
            ],
            () => queueMicrotask(readAll),
          ),
        );
      }
      return offs;
    },
  });

const actorStores = cachedPer(createActorStore);

/** The store of an actor (see `createActorStore`) */
export function getActorStore(
  actor: Actor.Implementation,
): SnapshotStore<ActorData> {
  return actorStores(actor);
}

// ---------------------------------------------------------------------------
// Settings

/** The one store of all our settings. */
export const getSettingsStore = once(() => {
  const prefix = `${systemId}.`;
  // world (and user) settings are Setting documents; client settings live in
  // localStorage and have their own hook
  const isOurs = (doc: Setting.Implementation) => doc.key.startsWith(prefix);
  return createHookStore(
    () => foundry.utils.deepClone(getSettingsDict()),
    [
      onHook("createSetting", isOurs),
      onHook("updateSetting", isOurs),
      onHook("clientSettingChanged", (key) => key.startsWith(prefix)),
    ],
  );
});

// ---------------------------------------------------------------------------
// The world's actors

/**
 * What's known of each of the world's actors without subscribing to it: enough
 * to look actors up by id, and to work out who's in which party.
 */
export type WorldActorEntry = {
  id: string;
  uuid: string;
  type: string;
  name: string;
  /** a party's members (its `actorIds`), or null for any other actor */
  memberIds: string[] | null;
};

/** An actor's `WorldActorEntry` */
export const toWorldActorEntry = (
  actor: Actor.Implementation,
): WorldActorEntry => {
  const system = actor.system as { actorIds?: unknown };
  return {
    id: actor.id ?? "",
    uuid: actor.uuid ?? "",
    type: actor.type,
    name: actor.name ?? "",
    memberIds:
      actor.type === "party" && Array.isArray(system.actorIds)
        ? [...(system.actorIds as string[])]
        : null,
  };
};

/**
 * The one store of the world's actors (not tokens' or compendiums'), in
 * order, as `WorldActorEntry`s: it changes when one is created, deleted, or
 * updated (only what the entries hold is copied, and they're structurally
 * shared). For anything that looks actors up by id (`useActorsSnapshot`), or
 * needs to know who's in which party.
 */
export const getWorldActorsStore = once(() => {
  const isWorldActor = (actor: Actor.Implementation) =>
    !actor.isToken && !actor.pack;
  return createHookStore<WorldActorEntry[]>(
    () =>
      (game as foundry.Game).actors?.contents.flatMap((actor) =>
        actor.id === null ? [] : [toWorldActorEntry(actor)],
      ) ?? [],
    [
      onHook("createActor", isWorldActor),
      onHook("updateActor", isWorldActor),
      onHook("deleteActor", isWorldActor),
    ],
  );
});

// ---------------------------------------------------------------------------
// Journal entries

/**
 * What's read of a journal page: its prepared data (`toObject(false)`), loosely
 * typed, since it depends on the page's type.
 */
export type JournalPageData = {
  _id: string | null;
  name: string;
  type: string;
  sort: number;
  title: { level: number; show: boolean };
  src?: string | null;
  image?: { caption?: string | null };
  text?: { content?: string | null };
  flags: Record<string, Record<string, unknown> | undefined>;
};

/** A journal entry's own data, and its pages */
export type JournalEntryData = {
  _id: string | null;
  name: string;
  flags: Record<string, Record<string, unknown> | undefined>;
  ownership: Record<string, number>;
  pages: JournalPageData[];
};
export type JournalEntrySnapshot = DeepReadonly<JournalEntryData>;

/**
 * A journal entry's own data, without its pages (from its source, so its pages
 * aren't copied only to be thrown away)
 */
function journalEntryOnlyData(entry: JournalEntry.Implementation) {
  const { pages: _pages, ...rest } = entry._source as unknown as {
    pages: unknown;
  } & Omit<JournalEntryData, "pages">;
  return foundry.utils.deepClone(rest);
}

/** A store of a journal entry with its pages, which follows changes to either. */
const createJournalEntryStore = (entry: JournalEntry.Implementation) =>
  createParentStore<JournalEntryData>(entry, {
    ownData: () => journalEntryOnlyData(entry),
    updateHook: "updateJournalEntry",
    collections: {
      pages: {
        documentName: "JournalEntryPage",
        contents: () => entry.pages.contents,
        toData: (page: JournalEntryPage.Implementation) => page.toObject(false),
      },
    },
  });

/** The store of a journal entry (see `createJournalEntryStore`) */
export const getJournalEntryStore: (
  entry: JournalEntry.Implementation,
) => SnapshotStore<JournalEntryData> = cachedPer(createJournalEntryStore);
