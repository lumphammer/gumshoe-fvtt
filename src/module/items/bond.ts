import {
  BooleanField,
  NumberField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import * as constants from "../../constants";
import { isDefaultActorImage } from "../../functions/isDefaultActorImage";
import type { PCModel } from "../actors/pc";
import {
  brokenBondPoints,
  clampBondPoints,
  isBondBroken,
  maxBondPoints,
} from "../bonds/rules";
import { InvestigatorItem } from "./InvestigatorItem";

/**
 * A Fall of DELTA GREEN Bond (p. 045): someone the Agent cares about. One
 * number, which the book variously calls the Bond's rating, strength or
 * points; there's no separate pool, and it never refreshes.
 */
export const bondSchema = {
  points: new NumberField({
    nullable: false,
    required: true,
    integer: true,
    min: brokenBondPoints,
    max: maxBondPoints,
    initial: 1,
  }),
  /** formed with a teammate (p. 046), rather than someone back home */
  isDeltaGreen: new BooleanField({
    nullable: false,
    required: true,
    initial: false,
  }),
  /**
   * The actor the Bond is with, if they have one: a teammate's, for a DELTA
   * GREEN Bond, so a later team crisis strengthens this Bond rather than
   * forming another (p. 046), or an NPC's
   */
  actorUuid: new StringField({
    nullable: true,
    required: false,
    blank: false,
    initial: null,
  }),
  /** for recording the damage each use does to the relationship (p. 120) */
  notes: new StringField({ nullable: false, required: true, initial: "" }),
};

export class BondModel extends TypeDataModel<typeof bondSchema, BondItem> {
  static defineSchema(): typeof bondSchema {
    return bondSchema;
  }

  get isBroken(): boolean {
    return isBondBroken(this.points);
  }

  /**
   * The most it can be set to: the owner's cap (2 when Adapted to Violence),
   * or its points now, if they're above that
   */
  getMaxPoints(): number {
    const actor = this.parent.actor;
    // by type rather than isPCActor: pc.ts imports this file
    const cap =
      actor?.type === constants.pc
        ? (actor.system as PCModel).getBondCap()
        : maxBondPoints;
    return Math.max(cap, this.points);
  }

  setPoints = async (points: number): Promise<void> => {
    await this.parent.update({
      system: {
        points: Math.min(this.getMaxPoints(), clampBondPoints(points)),
      },
    });
  };

  setIsDeltaGreen = async (isDeltaGreen: boolean): Promise<void> => {
    await this.parent.update({ system: { isDeltaGreen } });
  };

  /** the linked actor, if there is one and it still exists */
  get linkedActor(): Actor | null {
    if (!this.actorUuid) {
      return null;
    }
    const actor = fromUuidSync(this.actorUuid);
    return actor instanceof Actor ? actor : null;
  }

  /** Link the Bond to an actor, taking their picture if they have one */
  linkActor = async (actor: Actor): Promise<void> => {
    await this.parent.update({
      ...(isDefaultActorImage(actor.img) ? {} : { img: actor.img }),
      system: { actorUuid: actor.uuid },
    });
  };

  unlinkActor = async (): Promise<void> => {
    await this.parent.update({ system: { actorUuid: null } });
  };

  setNotes = async (notes: string): Promise<void> => {
    await this.parent.update({ system: { notes } });
  };
}

export type BondItem = InvestigatorItem<"bond">;

export function isBondItem(x: unknown): x is BondItem {
  return x instanceof InvestigatorItem && x.type === "bond";
}

export function assertBondItem(x: unknown): asserts x is BondItem {
  if (!isBondItem(x)) {
    throw new Error("Item is not a bond");
  }
}
