import * as constants from "../constants";
import { settings } from "../settings/settings";
import { isActiveCharacterActor } from "./actors/exports";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

/**
 * Override base Combat so we can do custom GUMSHOE-style initiative
 */
export class InvestigatorCombat extends Combat {
  override _onCreate(
    data: Combat.CreateData,
    options: Combat.Database.OnCreateOperation,
    userId: string,
  ) {
    super._onCreate(data, options, userId);
  }

  protected override _sortCombatants = (
    a: InvestigatorCombatant,
    b: InvestigatorCombatant,
  ): number => {
    if (settings.useTurnPassingInitiative.get()) {
      return a.name && b.name ? a.name.localeCompare(b.name) : 0;
    } else {
      return (b.initiative ?? 0) - (a.initiative ?? 0);
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
    await super.nextRound();
    // super.nextRound sets turn to 1, easier to do this than to recreate the
    // whole thing
    if (settings.useTurnPassingInitiative.get()) {
      await this.update({ turn: null });
    }
    return this;
  }

  get activeTurnPassingCombatant() {
    return this.getFlag(constants.systemId, "activeTurnPassingCombatant");
  }

  set activeTurnPassingCombatant(id: string | null) {
    void this.setFlag(constants.systemId, "activeTurnPassingCombatant", id);
    const nextTurn = this.turns.findIndex((t) => t._id === id);
    const updateData = { round: this.round, turn: nextTurn };
    void this.update(updateData);
  }
}
