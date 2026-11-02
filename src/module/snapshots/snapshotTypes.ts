// The shapes of document snapshots, by document type, so a snapshot's `system`
// is typed from its `type` (narrow it with `item.type === c.bond` and the
// like), and a hook given a typed document (a `PCActor`, a `WeaponItem`) hands
// its selector a typed snapshot.

import type { SourceData } from "../../fvtt-exports";
import type { npcSchema } from "../actors/npc";
import type { partySchema } from "../actors/party";
import type { PCSystemData } from "../actors/pc";
import type { cardSchema } from "../items/card";
import type { BondSystemData } from "../items/bond";
import type { EquipmentSystemData } from "../items/equipment";
import type { GeneralAbilitySystemData } from "../items/generalAbility";
import type { InvestigativeAbilitySystemData } from "../items/investigativeAbility";
import type { MwItemSystemData } from "../items/mwItem";
import type { NetworkContactSystemData } from "../items/networkContact";
import type { PersonalDetailSystemData } from "../items/personalDetail";
import type { WeaponSystemData } from "../items/weapon";
import type { DeepReadonly } from "./createSnapshotStore";

/** Each item type's system data */
export type ItemSystems = {
  generalAbility: GeneralAbilitySystemData;
  investigativeAbility: InvestigativeAbilitySystemData;
  equipment: EquipmentSystemData;
  weapon: WeaponSystemData;
  mwItem: MwItemSystemData;
  personalDetail: PersonalDetailSystemData;
  card: SourceData<typeof cardSchema>;
  bond: BondSystemData;
  networkContact: NetworkContactSystemData;
};
export type ItemType = keyof ItemSystems;

/** Each actor type's system data */
export type ActorSystems = {
  pc: PCSystemData;
  npc: SourceData<typeof npcSchema>;
  party: SourceData<typeof partySchema>;
};
export type ActorType = keyof ActorSystems;

/**
 * An item's prepared data (`toObject(false)`), for items of type `T` (any by
 * default): a union by type, so checking `type` narrows `system`.
 */
export type TypedItemData<T extends ItemType = ItemType> = {
  [K in T]: Omit<Item.Source, "type" | "system"> & {
    type: K;
    system: ItemSystems[K];
  };
}[T];
export type TypedItemSnapshot<T extends ItemType = ItemType> = DeepReadonly<
  TypedItemData<T>
>;

/**
 * An actor's prepared data, with its items and effects, for actors of type `T`
 * (any by default)
 */
export type TypedActorData<T extends ActorType = ActorType> = {
  [K in T]: Omit<Actor.Source, "type" | "system" | "items" | "effects"> & {
    type: K;
    system: ActorSystems[K];
    items: TypedItemData[];
    effects: ActiveEffect.Source[];
  };
}[T];
export type TypedActorSnapshot<T extends ActorType = ActorType> = DeepReadonly<
  TypedActorData<T>
>;

/** The types a document of type `D` can be, among `Known` (all, if none) */
type TypesOf<D, Known extends string> = D extends { type: infer T }
  ? [Extract<T, Known>] extends [never]
    ? Known
    : Extract<T, Known>
  : Known;

/** The snapshot of an item of TypeScript type `I` (e.g. `WeaponItem`) */
export type SnapshotOfItem<I> = TypedItemSnapshot<TypesOf<I, ItemType>>;

/**
 * The snapshot of an actor of TypeScript type `A` (e.g. `PCActor`), or null if
 * `A` can be null
 */
export type SnapshotOfActor<A> = A extends null | undefined
  ? null
  : TypedActorSnapshot<TypesOf<A, ActorType>>;

/**
 * The members of `T` (a list's items) whose `type` is `K`: for a finder which
 * checks the type, so a typed snapshot's result is typed. `T` itself when it
 * can't be narrowed (a live document, or a plain view of one).
 */
export type OfType<T, K extends string> = [Extract<T, { type: K }>] extends [
  never,
]
  ? T
  : Extract<T, { type: K }>;
