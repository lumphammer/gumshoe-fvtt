import {
  compareCombatantsPassing,
  compareCombatantsStandard,
} from "../components/combat/functions";
import * as constants from "../constants";
import { settings } from "../settings/settings";
import { isActiveCharacterActor } from "../v10Types";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

/**
 * Override base Combat so we can do custom GUMSHOE-style initiative
 */
export class InvestigatorCombat extends Combat {
  override _onCreate(data: Item.CreateData, options: any, userId: string) {
    // @ts-expect-error .create
    super._onCreate(data, options, userId);
    if (settings.useTurnPassingInitiative.get()) {
      void this.update({
        round: 1,
      });
    }
  }

  override get started() {
    return true;
  }

  protected override _sortCombatants = (
    a: InstanceType<typeof InvestigatorCombatant>,
    b: InstanceType<typeof InvestigatorCombatant>,
  ): number => {
    if (settings.useTurnPassingInitiative.get()) {
      return compareCombatantsPassing(this.activeTurnPassingCombatant)(a, b);
    } else {
      return compareCombatantsStandard(a, b);
    }
  };

  override async nextRound() {
    this.turns.forEach((combatant) => {
      const actor = combatant.actor;
      const max =
        actor !== null && isActiveCharacterActor(actor)
          ? actor.system.initiativePassingTurns
          : 1;
      combatant.passingTurnsRemaining = max;
    });
    this.activeTurnPassingCombatant = null;
    return super.nextRound();
  }

  get activeTurnPassingCombatant() {
    return this.getFlag(constants.systemId, "activeTurnPassingCombatant") as
      | string
      | null;
  }

  set activeTurnPassingCombatant(id: string | null) {
    void this.setFlag(constants.systemId, "activeTurnPassingCombatant", id);
  }
}
