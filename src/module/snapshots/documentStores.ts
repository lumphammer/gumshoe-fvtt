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

/** An item's prepared data (`toObject(false)`), its system data as `TSystem`. */
export type ItemData<TSystem = unknown> = Omit<Item.Source, "system"> & {
  system: TSystem;
};
export type ItemSnapshot<TSystem = unknown> = DeepReadonly<ItemData<TSystem>>;

/**
 * An actor's prepared data, with its items and effects, its system data as
 * `TSystem`.
 */
export type ActorData<TSystem = unknown> = Omit<
  Actor.Source,
  "system" | "items" | "effects"
> & {
  system: TSystem;
  items: ItemData[];
  effects: ActiveEffect.Source[];
};
export type ActorSnapshot<TSystem = unknown> = DeepReadonly<ActorData<TSystem>>;

export type SettingsSnapshot = DeepReadonly<SettingsDict>;

type Off = () => void;

/** Listen to a hook until the returned function is called. */
function on<K extends Hooks.HookName>(hook: K, fn: Hooks.Function<K>): Off {
  const id = Hooks.on(hook, fn);
  return () => Hooks.off(hook, id);
}

const itemData = (item: Item.Implementation) =>
  item.toObject(false) as unknown as ItemData;

/** A store of one item, which follows changes to it and its effects. */
function createItemStore<TSystem>(item: Item.Implementation) {
  return createSnapshotStore<ItemData<TSystem>>(
    () => itemData(item) as ItemData<TSystem>,
    (onChange) => {
      const onItem = (doc: Item.Implementation) => {
        if (doc === item) onChange();
      };
      const onEffect = (effect: ActiveEffect.Implementation) => {
        if (effect.parent === item) onChange();
      };
      const offs = [
        on("updateItem", onItem),
        on("createActiveEffect", onEffect),
        on("updateActiveEffect", onEffect),
        on("deleteActiveEffect", onEffect),
      ];
      return () => offs.forEach((off) => off());
    },
  );
}

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

function actorData(actor: Actor.Implementation) {
  return {
    ...actorOnlyData(actor),
    items: actor.items.contents.map(itemData),
    effects: actor.effects.contents.map((effect) => effect.toObject(false)),
  } as unknown as ActorData;
}

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
 * A store of an actor with its items and effects, which follows changes to
 * any of them. Only the document that changed is copied (and the actor's own
 * data, which can be derived from its items).
 */
function createActorStore<TSystem>(actor: Actor.Implementation) {
  return createSnapshotStore<ActorData<TSystem>>(
    () => actorData(actor) as ActorData<TSystem>,
    (onChange: OnChange<ActorData<TSystem>>) => {
      const refresh = (
        collection: "items" | "effects" | null,
        id?: string | null,
        doc?: unknown,
      ) => {
        onChange((previous) => {
          const next = {
            ...(previous as ActorData<TSystem>),
            ...actorOnlyData(actor),
          } as ActorData<TSystem>;
          if (collection && id) {
            (next[collection] as unknown[]) = withDocument(
              previous[collection] as readonly { _id: string | null }[],
              id,
              (doc ?? null) as { _id: string | null } | null,
            );
          }
          return next;
        });
      };

      const isOurs = (doc: { parent: unknown }) => doc.parent === actor;
      const onItem = (item: Item.Implementation) => {
        if (isOurs(item)) refresh("items", item.id, itemData(item));
      };
      const onDeleteItem = (item: Item.Implementation) => {
        if (isOurs(item)) refresh("items", item.id, null);
      };
      const onEffect = (effect: ActiveEffect.Implementation) => {
        if (isOurs(effect)) {
          refresh("effects", effect.id, effect.toObject(false));
        } else if (effect.parent instanceof Item && isOurs(effect.parent)) {
          // an item's own effect: the item's copy includes it
          const item = effect.parent;
          refresh("items", item.id, itemData(item));
        }
      };
      const onDeleteEffect = (effect: ActiveEffect.Implementation) => {
        if (isOurs(effect)) refresh("effects", effect.id, null);
        else onEffect(effect);
      };

      const offs = [
        on("updateActor", (doc) => {
          if (doc === actor) refresh(null);
        }),
        on("createItem", onItem),
        on("updateItem", onItem),
        on("deleteItem", onDeleteItem),
        on("createActiveEffect", onEffect),
        on("updateActiveEffect", onEffect),
        on("deleteActiveEffect", onDeleteEffect),
      ];
      return () => offs.forEach((off) => off());
    },
  );
}

// One store per document, shared by everything that reads it (e.g. the
// badges on every ability row of a PC sheet share the PC's store). Weak, so a
// store goes when its document does; and a store only listens to hooks while
// something is subscribed to it.
const itemStores = new WeakMap<
  Item.Implementation,
  ReturnType<typeof createItemStore>
>();
const actorStores = new WeakMap<
  Actor.Implementation,
  ReturnType<typeof createActorStore>
>();

/** The store of an item (see `createItemStore`) */
export function getItemStore<TSystem>(
  item: Item.Implementation,
): SnapshotStore<ItemData<TSystem>> {
  let store = itemStores.get(item);
  if (!store) {
    store = createItemStore(item);
    itemStores.set(item, store);
  }
  return store as SnapshotStore<ItemData<TSystem>>;
}

/** The store of an actor (see `createActorStore`) */
export function getActorStore<TSystem>(
  actor: Actor.Implementation,
): SnapshotStore<ActorData<TSystem>> {
  let store = actorStores.get(actor);
  if (!store) {
    store = createActorStore(actor);
    actorStores.set(actor, store);
  }
  return store as SnapshotStore<ActorData<TSystem>>;
}

let settingsStore: ReturnType<typeof createSettingsStore> | null = null;

function createSettingsStore() {
  return createSnapshotStore<SettingsDict>(
    () => foundry.utils.deepClone(getSettingsDict()),
    (onChange) => {
      const prefix = `${systemId}.`;
      // world (and user) settings are Setting documents; client settings
      // live in localStorage and have their own hook
      const onDocument = (doc: Setting.Implementation) => {
        if (doc.key.startsWith(prefix)) onChange();
      };
      const offs = [
        on("createSetting", onDocument),
        on("updateSetting", onDocument),
        on("clientSettingChanged", (key) => {
          if (key.startsWith(prefix)) onChange();
        }),
      ];
      return () => offs.forEach((off) => off());
    },
  );
}

/** The one store of all our settings. */
export function getSettingsStore() {
  settingsStore ??= createSettingsStore();
  return settingsStore;
}
