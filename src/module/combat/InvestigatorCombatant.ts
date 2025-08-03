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
      `InvestigatorCombatant._preUpdate called with changed: ${JSON.stringify(changed, null, 2)}`,
    );
    return super._preUpdate(changed, options, user);
  }
}
