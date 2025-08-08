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
  // turnOrders: string[][] = [];

  constructor(data?: Combat.CreateData, context?: Combat.ConstructionContext) {
    systemLogger.debug("InvestigatorCombat constructor called", data, context);
    super(data, context);
  }

  // ///////////////////////////////////////////////////////////////////////////
  // override to make sure we're creating the right kind of combatant
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

  // ///////////////////////////////////////////////////////////////////////////
  // override to make sure we're creating the right kind of combat
  static override create<Temporary extends boolean | undefined = false>(
    data: Combat.CreateData | Combat.CreateData[],
    operation?: Combat.Database.CreateOperation<Temporary>,
    ...rest: any
  ): Promise<Combat.TemporaryIf<Temporary> | undefined> {
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

    // in theory .create methods on documents can always take an array, but
    // Combat#_onCreate has some logic that assumes a single item
    const result = super.create(data, operation);
    return result;
  }

  protected override _preUpdate(
    ...[changed, options, user]: Parameters<Combat<SubType>["_preUpdate"]>
  ): Promise<boolean | void> {
    systemLogger.log(
      `InvestigatorCombat#_preUpdate called with changed: ${JSON.stringify(changed, null, 2)}`,
    );
    return super._preUpdate(changed, options, user);
  }

  protected override _onUpdate(
    ...[changed, options, userId]: Parameters<Combat<SubType>["_onUpdate"]>
  ) {
    systemLogger.log(
      `InvestigatorCombat#_onUpdate called with changed: ${JSON.stringify(changed, null, 2)}`,
    );
    super._onUpdate(changed, options, userId);
  }

  protected static override async _preUpdateOperation(
    ...[documents, operation, user]: Parameters<
      (typeof Combat)["_preUpdateOperation"]
    >
  ) {
    systemLogger.log(
      `InvestigatorCombat._preUpdateOperation called with documents: ${documents.map((d) => d.id).join(", ")}`,
    );
    return super._preUpdateOperation(documents, operation, user);
  }

  protected static override async _onUpdateOperation(
    ...[documents, operation, user]: Parameters<
      (typeof Combat)["_onUpdateOperation"]
    >
  ) {
    systemLogger.log(
      `InvestigatorCombat._onUpdateOperation called with documents: ${documents.map((d) => d.id).join(", ")}`,
    );
    return super._onUpdateOperation(documents, operation, user);
  }

  protected override _preUpdateDescendantDocuments(
    // destructuring a spread because the type for the args is a tuple 🙃
    ...[
      parent,
      collection,
      changes,
      options,
      userId,
    ]: Combat.PreUpdateDescendantDocumentsArgs
  ) {
    systemLogger.log(
      `InvestigatorCombat#_preUpdateDescendantDocuments called with changes: ${JSON.stringify(changes, null, 2)}`,
    );
    super._preUpdateDescendantDocuments(
      ...[parent, collection, changes, options, userId],
    );
  }

  protected override _onUpdateDescendantDocuments(
    ...args: Combat.OnUpdateDescendantDocumentsArgs
  ) {
    systemLogger.log("InvestigatorCombat#_onUpdateDescendantDocuments called");
    super._onUpdateDescendantDocuments(...args);
  }

  protected _compareCombatants = (
    a: InvestigatorCombatant,
    b: InvestigatorCombatant,
  ): number => {
    if (settings.useTurnPassingInitiative.get()) {
      return a.name && b.name ? a.name.localeCompare(b.name) : 0;
    } else {
      return (b.system.initiative ?? 0) - (a.system.initiative ?? 0);
    }
  };

  // borrowed from client/documents/combat.d.mts
  override setupTurns() {
    const err = new Error();
    systemLogger.log("InvestigatorCombat.setupTurns called", err.stack);

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

  override async startCombat() {
    const superResult = await super.startCombat();
    if (isTurnPassingCombat(this)) {
      this.turn = null;
      await this.update({ turn: null });
    }
    return superResult;
  }
}
