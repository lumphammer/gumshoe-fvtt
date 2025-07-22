import * as constants from "../../constants";
import { isNullOrEmptyString } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import { assertActiveCharacterActor } from "../actors/exports";
import { isGeneralAbilityItem } from "../items/generalAbility";
import { InvestigatorItem } from "../items/InvestigatorItem";

const getValue = <T>(resource: T): T | number => {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "value" in resource &&
    typeof resource.value === "number"
  ) {
    return resource.value;
  }
  return resource;
};

/**
 * Override base Combatant class to override the initiative formula.
 */
export class InvestigatorCombatant<
  SubType extends Combatant.SubType = Combatant.SubType,
> extends Combatant<SubType> {
  static override create<Temporary extends boolean | undefined = false>(
    data: Combatant.CreateData | Combatant.CreateData[],
    operation?: Combatant.Database.CreateOperation<Temporary>,
  ) {
    return super.create(data, operation);
  }

  doGumshoeInitiative = async () => {
    if (this._id) {
      const initiative = this.actor
        ? InvestigatorCombatant.getGumshoeInitiative(this.actor)
        : 0;
      await this.update({ initiative });
    }
  };

  static getGumshoeInitiative(actor: Actor): number {
    assertActiveCharacterActor(actor);
    // get the ability name, and if not set, use the first one on the system
    // config (we had a bug where some chars were getting created without an
    // init ability name)
    const abilityName =
      actor?.system.initiativeAbility ||
      [...settings.combatAbilities.get()].sort()[0] ||
      "";
    // and if it was null, set it on the actor now.
    if (actor && isNullOrEmptyString(actor.system.initiativeAbility)) {
      void actor.update({ system: { initiativeAbility: abilityName } });
    }
    const ability = actor.items.find(
      (item: InvestigatorItem) =>
        item.type === constants.generalAbility && item.name === abilityName,
    );
    if (ability && isGeneralAbilityItem(ability)) {
      const score = ability.system.rating;
      return score;
    } else {
      return 0;
    }
  }

  _getInitiativeFormula() {
    return this.actor
      ? InvestigatorCombatant.getGumshoeInitiative(this.actor).toString()
      : "0";
  }

  get active() {
    return this.combat?.turns.indexOf(this) === this.combat?.turn;
  }

  get effectiveImg() {
    return this.img || CONST.DEFAULT_TOKEN;
  }

  get effectiveResource() {
    return this.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
      ? getValue(this.resource)
      : null;
  }
}
