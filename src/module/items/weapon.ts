import { createNotesWithFormatField } from "../schemaFields";

import StringField = foundry.data.fields.StringField;
import NumberField = foundry.data.fields.NumberField;
import BooleanField = foundry.data.fields.BooleanField;
import SchemaField = foundry.data.fields.SchemaField;

import TypeDataModel = foundry.abstract.TypeDataModel;

import { NoteWithFormat } from "../../types";
import { InvestigatorItem } from "./InvestigatorItem";

export const weaponSchema = {
  // notes: NoteWithFormat;
  notes: createNotesWithFormatField(),
  // ability: string;
  ability: new StringField({ nullable: false, required: true }),
  // damage: number;
  damage: new NumberField({ nullable: false, required: true, initial: 0 }),
  // pointBlankDamage: number;
  pointBlankDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  // closeRangeDamage: number;
  closeRangeDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  // nearRangeDamage: number;
  nearRangeDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  // longRangeDamage: number;
  longRangeDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  // isPointBlank: boolean;
  isPointBlank: new BooleanField({ nullable: false, required: true }),
  // isCloseRange: boolean;
  isCloseRange: new BooleanField({ nullable: false, required: true }),
  // isNearRange: boolean;
  isNearRange: new BooleanField({ nullable: false, required: true }),
  // isLongRange: boolean;
  isLongRange: new BooleanField({ nullable: false, required: true }),
  // usesAmmo: boolean;
  usesAmmo: new BooleanField({ nullable: false, required: true }),
  // ammoPerShot: number;
  ammoPerShot: new NumberField({ nullable: false, required: true, initial: 0 }),
  // cost: number;
  cost: new NumberField({ nullable: false, required: true, initial: 0 }),
  // ammo: {
  //   min: number;
  //   max: number;
  //   value: number;
  // };
  ammo: new SchemaField(
    {
      min: new NumberField({ nullable: false, required: true, initial: 0 }),
      max: new NumberField({ nullable: false, required: true, initial: 0 }),
      value: new NumberField({ nullable: false, required: true, initial: 0 }),
    },
    {
      nullable: false,
      required: true,
    },
  ),
};

export class WeaponModel extends TypeDataModel<
  typeof weaponSchema,
  WeaponItem
> {
  static defineSchema(): typeof weaponSchema {
    return weaponSchema;
  }

  setCost = (cost: number) => {
    return this.parent.update({
      system: {
        cost,
      },
    });
  };

  setAmmoMax = (max: number) => {
    return this.parent.update({
      system: {
        ammo: {
          max,
        },
      },
    });
  };

  setAmmo = (value: number) => {
    return this.parent.update({
      system: {
        ammo: {
          value,
        },
      },
    });
  };

  reload = async (): Promise<void> => {
    await this.parent.update({
      system: {
        ammo: {
          value: this.ammo.max,
        },
      },
    });
  };

  setAmmoPerShot = async (ammoPerShot: number): Promise<void> => {
    await this.parent.update({
      system: { ammoPerShot },
    });
  };

  setUsesAmmo = async (usesAmmo: boolean): Promise<void> => {
    await this.parent.update({
      system: { usesAmmo },
    });
  };

  setNotes = async (newNotes: NoteWithFormat): Promise<void> => {
    await this.parent.update({ system: { notes: newNotes } });
  };

  setAbility = async (ability: string): Promise<void> => {
    await this.parent.update({ system: { ability } });
  };

  setDamage = async (damage: number): Promise<void> => {
    await this.parent.update({ system: { damage } });
  };

  setPointBlankDamage = async (pointBlankDamage: number): Promise<void> => {
    await this.parent.update({ system: { pointBlankDamage } });
  };

  setCloseRangeDamage = async (closeRangeDamage: number): Promise<void> => {
    await this.parent.update({ system: { closeRangeDamage } });
  };

  setNearRangeDamage = async (nearRangeDamage: number): Promise<void> => {
    await this.parent.update({ system: { nearRangeDamage } });
  };

  setLongRangeDamage = async (longRangeDamage: number): Promise<void> => {
    await this.parent.update({ system: { longRangeDamage } });
  };

  setIsPointBlank = async (isPointBlank: boolean): Promise<void> => {
    await this.parent.update({ system: { isPointBlank } });
  };

  setIsCloseRange = async (isCloseRange: boolean): Promise<void> => {
    await this.parent.update({ system: { isCloseRange } });
  };

  setIsNearRange = async (isNearRange: boolean): Promise<void> => {
    await this.parent.update({ system: { isNearRange } });
  };

  setIsLongRange = async (isLongRange: boolean): Promise<void> => {
    await this.parent.update({ system: { isLongRange } });
  };
}

export type WeaponItem = InvestigatorItem<"weapon">;

export function isWeaponItem(x: unknown): x is WeaponItem {
  return x instanceof InvestigatorItem && x.type === "weapon";
}

export function assertWeaponItem(x: unknown): asserts x is WeaponItem {
  if (!isWeaponItem(x)) {
    throw new Error("Item is not a weapon");
  }
}
