// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */

import { nanoid } from "nanoid";

export class InvestigatorActor<
  SubType extends Actor.SubType = Actor.SubType,
> extends Actor<SubType> {
  setName = (name: string): Promise<this | undefined> => {
    return this.update({ name });
  };

  protected _combatantEffectsHandlers: Map<
    string,
    (effects: SchemaField.SourceData<ActiveEffect.Schema>[]) => void
  > = new Map();

  protected _getCombatantEffectsData(): SchemaField.SourceData<ActiveEffect.Schema>[] {
    return this.temporaryEffects
      .filter((e) => !e.statuses.has(CONFIG.specialStatusEffects.DEFEATED))
      .map((e) => e.toJSON());
  }

  protected _currentCombatantEffectsData: SchemaField.SourceData<ActiveEffect.Schema>[] =
    this._getCombatantEffectsData();

  registerCombatantEffectsHandler(
    handler: (effects: SchemaField.SourceData<ActiveEffect.Schema>[]) => void,
  ): () => void {
    const id = nanoid();
    this._combatantEffectsHandlers.set(id, handler);
    handler(this._currentCombatantEffectsData);
    return () => this._combatantEffectsHandlers.delete(id);
  }

  protected _updateCombatantEffectsData(): void {
    const latestData = this._getCombatantEffectsData();
    const same =
      latestData.length === this._currentCombatantEffectsData.length &&
      latestData.every(
        (effect, i) => effect._id === this._currentCombatantEffectsData[i]._id,
      );
    if (same) {
      return;
    }
    this._currentCombatantEffectsData = latestData;
    for (const handler of this._combatantEffectsHandlers.values()) {
      handler(this._currentCombatantEffectsData);
    }
  }

  protected override _onEmbeddedDocumentChange(): void {
    super._onEmbeddedDocumentChange();
    this._updateCombatantEffectsData();
  }
}
