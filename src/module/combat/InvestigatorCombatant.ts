import { systemLogger } from "../../functions/utilities";

/**
 * Override base Combatant class to override the initiative formula.
 */
export class InvestigatorCombatant<
  SubType extends Combatant.SubType = Combatant.SubType,
> extends Combatant<SubType> {
  /**
   * @deprecated Use ClassicCombatant#system.initiative instead.
   */
  override initiative: number | null = null;

  protected override _preUpdate(
    changed: Combatant.UpdateData,
    options: Combatant.Database.PreUpdateOptions,
    user: User.Implementation,
  ) {
    systemLogger.log(
      `InvestigatorCombatant#_preUpdate called with changed: ${JSON.stringify(changed, null, 2)}`,
    );
    return super._preUpdate(changed, options, user);
  }

  protected override _onUpdate(
    changed: Combatant.UpdateData,
    options: Combatant.Database.OnUpdateOperation,
    userId: string,
  ) {
    systemLogger.log(
      `InvestigatorCombatant#_onUpdate called with changed: ${JSON.stringify(changed, null, 2)}`,
    );
    super._onUpdate(changed, options, userId);
  }

  protected static override async _preUpdateOperation(
    documents: Combatant.Implementation[],
    operation: Combatant.Database.Update,
    user: User.Implementation,
  ) {
    systemLogger.log(
      `InvestigatorCombatant._preUpdateOperation called with documents: ${documents.map((d) => d.id).join(", ")}`,
    );
    return super._preUpdateOperation(documents, operation, user);
  }

  protected static override async _onUpdateOperation(
    documents: Combatant.Implementation[],
    operation: Combatant.Database.Update,
    user: User.Implementation,
  ) {
    systemLogger.log(
      `InvestigatorCombatant._onUpdateOperation called with documents: ${documents.map((d) => d.id).join(", ")}`,
    );
    return super._onUpdateOperation(documents, operation, user);
  }
}
