import { systemLogger } from "../../functions/utilities";
import { Document } from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import { InvestigatorCombatant } from "./InvestigatorCombatant";
import { isTurnPassingCombat } from "./turnPassingCombat";

/**
 * Override base Combat so we can do custom GUMSHOE-style initiative
 */
export class InvestigatorCombat<
  out SubType extends Combat.SubType = Combat.SubType,
> extends Combat<SubType> {
  turnOrders: string[][] = [];

  constructor(data?: Combat.CreateData, context?: Combat.ConstructionContext) {
    super(data, context);
    systemLogger.log("InvestigatorCombat.constructor", this.turnOrders);
  }

  /**
   * Override createEmbeddedDocuments to
   */
  override async createEmbeddedDocuments<
    EmbeddedName extends Combat.Embedded.Name,
  >(
    embeddedName: EmbeddedName,
    origData: Document.CreateDataForName<EmbeddedName>[] | undefined,
    operation?: Document.Database.CreateOperationForName<EmbeddedName>,
  ): Promise<Array<Document.StoredForName<EmbeddedName>>> {
    const newType = this.type;
    const newData =
      embeddedName === "Combatant"
        ? origData?.map((d) => ({
            ...d,
            type: ("type" in d ? d.type : null) ?? newType,
          }))
        : origData;
    return super.createEmbeddedDocuments(embeddedName, newData, operation);
  }

  override _onCreate(
    data: Combat.CreateData,
    options: Combat.Database.OnCreateOperation,
    userId: string,
  ) {
    systemLogger.log("InvestigatorCombat._onCreate");
    super._onCreate(data, options, userId);
  }

  // override the base class to make sure we're creating the right kind of
  // combat
  static override create<Temporary extends boolean | undefined = false>(
    data: Combat.CreateData | Combat.CreateData[],
    operation?: Combat.Database.CreateOperation<Temporary>,
    ...rest: any
  ) {
    const isTurnPassing = settings.useTurnPassingInitiative.get();
    const subType = isTurnPassing ? "turnPassing" : "classic";
    if (data === undefined) {
      data = { type: subType };
    } else if (Array.isArray(data)) {
      for (const d of data) {
        d.type = d.type === undefined ? subType : d.type;
      }
    } else {
      data.type = data.type === undefined ? subType : data.type;
    }
    systemLogger.log("InvestigatorCombat.create", data, operation, rest);

    // in theory .create methods on documents can always take an array, but
    // Combat#_onCreate has some logic that assumes a single item
    const result = super.create(data, operation);
    return result;
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
    await super.nextRound();
    // super.nextRound sets turn to 1, easier to do this than to recreate the
    // whole thing
    if (isTurnPassingCombat(this)) {
      this.turn = null;
      await this.update({ turn: null });
    }
    return this;
  }

  // override async startCombat(): Promise<this | undefined> {
  //   const superResult = await super.startCombat();
  //   if (isTurnPassingCombat(this)) {
  //     this.turn = null;
  //     await this.update({ turn: null });
  //   }
  //   return superResult;
  // }
}
