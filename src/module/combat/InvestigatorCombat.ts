import * as constants from "../../constants";
import { systemLogger } from "../../functions/utilities";
import { settings } from "../../settings/settings";
import { isActiveCharacterActor } from "../actors/exports";
import { InvestigatorCombatant } from "./InvestigatorCombatant";

/**
 * Override base Combat so we can do custom GUMSHOE-style initiative
 */
export class InvestigatorCombat extends Combat {
  turnOrders: string[][] = [];

  constructor(...args: Combat.ConstructorArgs) {
    super(...args);
    systemLogger.log("InvestigatorCombat.constructor", this.turnOrders);
    // this.system;
    // void this.update({ turnOrders: [...this.turnOrders, ["a", "b", "c"]] });
  }

  override _onCreate(
    data: Combat.CreateData,
    options: Combat.Database.OnCreateOperation,
    userId: string,
  ) {
    systemLogger.log("InvestigatorCombat._onCreate");
    super._onCreate(data, options, userId);
  }

  protected _compareCombatants = (
    a: InvestigatorCombatant,
    b: InvestigatorCombatant,
  ): number => {
    if (settings.useTurnPassingInitiative.get()) {
      return a.name && b.name ? a.name.localeCompare(b.name) : 0;
    } else {
      return (b.initiative ?? 0) - (a.initiative ?? 0);
    }
  };

  // borrowed from client/documents/combat.d.mts
  override setupTurns() {
    this.turns ||= [];

    // Determine the turn order and the current turn
    const turns = this.combatants.contents.sort(this._compareCombatants);
    if (this.turn !== null) {
      if (this.turn < 0) {
        this.turn = 0;
      } else if (this.turn >= turns.length) {
        this.turn = 0;
        this.round++;
      }
    }

    // Update state tracking
    const c = this.turn !== null ? turns[this.turn] : undefined;
    this.current = this._getCurrentState(c);

    // One-time initialization of the previous state
    if (!this.previous) this.previous = this.current;

    // Return the array of prepared turns
    return (this.turns = turns);
  }

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
