// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */

import { produce } from "immer";

import type { SourceData } from "../../fvtt-exports";
import { getEditedBarValue } from "../tokenBars";
import { isCombatantEffectShown } from "./isCombatantEffectShown";

export class InvestigatorActor<
  SubType extends Actor.SubType = Actor.SubType,
> extends Actor<SubType> {
  /**
   * Handy setter for the actor's name
   */
  setName = (name: string): Promise<this | undefined> => {
    return this.update({ name });
  };

  /**
   * Like foundry's, but bars are clamped to the resource's min, not 0, so the
   * token HUD can take Health below 0.
   */
  override async modifyTokenAttribute(
    attribute: string,
    value: number,
    isDelta = false,
    isBar = true,
  ): Promise<this | undefined> {
    if (!isBar) {
      return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
    }
    const attr = foundry.utils.getProperty(this.system, attribute) as {
      value: number;
      max: number;
      min?: number | null;
    };
    const current = attr.value;
    const update = isDelta ? current + value : value;
    if (update === current) return this;

    const updates = {
      [`system.${attribute}.value`]: getEditedBarValue(
        current,
        value,
        isDelta,
        attr.min,
        attr.max,
      ),
    };

    // Allow a hook to override these changes. (fvtt-types leaves out the
    // actor, which foundry passes as a third argument.)
    const hooks = Hooks as unknown as {
      call(hook: string, ...args: unknown[]): boolean;
    };
    const allowed = hooks.call(
      "modifyTokenAttribute",
      { attribute, value, isDelta, isBar },
      updates,
      this,
    );
    return allowed !== false ? this.update(updates) : this;
  }

  // ***************************************************************************
  // COMBATANT EFFECTS
  //
  // These are the effects that need to be shown in the combat tracker

  // the most recent calculated data
  protected _currentCombatantEffectsData: SourceData<ActiveEffect.Schema>[] =
    this._getCombatantEffectsData();

  // store of registered handlers
  protected _combatantEffectsHandlers: Set<
    (effects: SourceData<ActiveEffect.Schema>[]) => void
  > = new Set();

  // calculate new data
  protected _getCombatantEffectsData(): SourceData<ActiveEffect.Schema>[] {
    const constants = {
      defeatedStatusId: CONFIG.specialStatusEffects.DEFEATED,
      showIcon: CONST.ACTIVE_EFFECT_SHOW_ICON,
    };
    return this.appliedEffects
      .filter((e) => isCombatantEffectShown(e, constants))
      .map((e) => e.toJSON());
  }

  // add a new handler
  registerCombatantEffectsHandler(
    handler: (effects: SourceData<ActiveEffect.Schema>[]) => void,
  ): () => void {
    this._combatantEffectsHandlers.add(handler);
    handler(this._currentCombatantEffectsData);
    return () => this._combatantEffectsHandlers.delete(handler);
  }

  /**
   * This gets called from _onEmbeddedDocumentChange
   */
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

  // ***************************************************************************
  // IMMUTABLE UPDATE HANDLERS

  protected _currentImmutableData = this.toJSON();

  protected _immutableDataUpdateHandlers: Set<
    (data: SourceData<Actor.Schema>) => void
  > = new Set();

  registerImmutableDataUpdateHandler(
    handler: (data: SourceData<Actor.Schema>) => void,
  ): () => void {
    this._immutableDataUpdateHandlers.add(handler);
    handler(this._currentImmutableData);
    return () => this._immutableDataUpdateHandlers.delete(handler);
  }

  protected _updateImmutableData(changed: Actor.UpdateData): void {
    const newImmutableData = produce(this._currentImmutableData, (draft) => {
      foundry.utils.mergeObject(draft, changed);
    });
    if (newImmutableData === this._currentImmutableData) return;
    this._currentImmutableData = newImmutableData;
    for (const handler of this._immutableDataUpdateHandlers.values()) {
      handler(this._currentImmutableData);
    }
  }

  protected override _onUpdate(
    changed: Actor.UpdateData,
    options: Actor.Database.OnUpdateOperation,
    userId: string,
  ): void {
    super._onUpdate(changed, options, userId);
    this._updateImmutableData(changed);
  }
}
