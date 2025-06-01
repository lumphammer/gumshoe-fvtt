import {
  BooleanField,
  NumberField,
  SchemaField,
  SourceData,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { NoteWithFormat } from "../../types";
import { createNotesWithFormatField } from "../schemaFields";
import { InvestigatorItem } from "./InvestigatorItem";

export const weaponSchema = {
  ability: new StringField({
    nullable: false,
    required: true,
    initial: "Scuffling",
  }),
  ammo: new SchemaField(
    {
      min: new NumberField({ nullable: false, required: true, initial: 0 }),
      max: new NumberField({ nullable: false, required: true, initial: 10 }),
      value: new NumberField({ nullable: false, required: true, initial: 0 }),
    },
    {
      nullable: false,
      required: true,
    },
  ),
  ammoPerShot: new NumberField({ nullable: false, required: true, initial: 1 }),
  closeRangeDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  cost: new NumberField({ nullable: false, required: true, initial: 0 }),
  damage: new NumberField({ nullable: false, required: true, initial: 0 }),
  isCloseRange: new BooleanField({ nullable: false, required: true }),
  isLongRange: new BooleanField({ nullable: false, required: false }),
  isNearRange: new BooleanField({ nullable: false, required: true }),
  isPointBlank: new BooleanField({ nullable: false, required: true }),
  longRangeDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  nearRangeDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  notes: createNotesWithFormatField(),
  pointBlankDamage: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
  usesAmmo: new BooleanField({
    nullable: false,
    required: true,
    initial: true,
  }),
};

export type WeaponSystemData = SourceData<typeof weaponSchema>;

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
