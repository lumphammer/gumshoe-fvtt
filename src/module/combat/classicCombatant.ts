import { assertGame } from "../../functions/isGame";
import { isNullOrEmptyString } from "../../functions/utilities";
import { Document, NumberField, TypeDataModel } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import {
  assertActiveCharacterActor,
  isActiveCharacterActor,
} from "../actors/exports";
import {
  GeneralAbilityItem,
  isGeneralAbilityItem,
} from "../items/generalAbility";
import { InvestigatorItem } from "../items/InvestigatorItem";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

function getGumshoeInitiative(
  actor: Actor.Implementation | undefined | null | string,
): number {
  if (!isActiveCharacterActor(actor)) {
    return 0;
  }
  // get the ability name, and if not set, use the first one on the system
  // config (we had a bug where some chars were getting created without an
  // init ability name)
  const abilityName =
    actor.system.initiativeAbility ||
    [...settings.combatAbilities.get()].sort()[0] ||
    "";
  // and if it was null, set it on the actor now.
  if (actor && isNullOrEmptyString(actor.system.initiativeAbility)) {
    void actor.update({ system: { initiativeAbility: abilityName } });
  }
  const ability = actor.items.find(
    (item: InvestigatorItem): item is GeneralAbilityItem =>
      isGeneralAbilityItem(item) && item.name === abilityName,
  );
  return ability?.system.rating ?? 0;
}

export const classicCombatantSchema = {
  initiative: new NumberField({
    nullable: false,
    required: true,
    initial: 0,
  }),
};

export class ClassicCombatantModel extends TypeDataModel<
  typeof classicCombatantSchema,
  InvestigatorCombatant<"classic">
> {
  static defineSchema(): typeof classicCombatantSchema {
    return classicCombatantSchema;
  }

  override _preCreate(
    data: TypeDataModel.ParentAssignmentType<
      typeof classicCombatantSchema,
      InvestigatorCombatant<"classic">
    >,
    options: Document.Database.PreCreateOptions<foundry.abstract.types.DatabaseCreateOperation>,
    user: foundry.documents.User.Implementation,
  ) {
    assertGame(game);

    const actor = data.actorId && game.actors.get(data.actorId);
    const initiative = getGumshoeInitiative(actor);
    if (data.initiative === undefined) {
      this.updateSource({ initiative });
    }
    return super._preCreate(data, options, user);
  }

  async resetInitiative(): Promise<void> {
    assertGame(game);
    const actor = this.parent.actor;
    assertActiveCharacterActor(actor);
    await this.parent.update({
      system: { initiative: getGumshoeInitiative(actor) },
    });
  }
}

export type ClassicCombatant = InvestigatorCombatant<"classic">;

export function isClassicCombatant(x: unknown): x is ClassicCombatant {
  return x instanceof InvestigatorCombatant && x.type === "classic";
}

export function assertClassicCombatant(
  x: unknown,
): asserts x is ClassicCombatant {
  if (!isClassicCombatant(x)) {
    console.error(x);
    throw new Error("Expected combatant to be a ClassicCombatant");
  }
}
