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

  /**
   * @deprecated Use ClassicCombatant#system.initiative instead.
   */
  override initiative: number | null = null;
}
