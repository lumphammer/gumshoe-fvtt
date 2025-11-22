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
    return super._preUpdate(changed, options, user);
  }

  protected override _onUpdate(
    changed: Combatant.UpdateData,
    options: Combatant.Database.OnUpdateOperation,
    userId: string,
  ) {
    super._onUpdate(changed, options, userId);
  }

  protected static override async _preUpdateOperation(
    documents: Combatant.Implementation[],
    operation: Combatant.Database.Update,
    user: User.Implementation,
  ) {
    return super._preUpdateOperation(documents, operation, user);
  }

  protected static override async _onUpdateOperation(
    documents: Combatant.Implementation[],
    operation: Combatant.Database.Update,
    user: User.Implementation,
  ) {
    return super._onUpdateOperation(documents, operation, user);
  }

  // store of registered handlers
  protected _resourceHandlers: Set<(resource: number | string | null) => void> =
    new Set();

  // add a new handler
  registerResourceHandler(
    handler: (resource: number | string | null) => void,
  ): () => void {
    this._resourceHandlers.add(handler);
    handler(this.resource);
    return () => this._resourceHandlers.delete(handler);
  }

  override updateResource() {
    const resource = super.updateResource();
    for (const handler of this._resourceHandlers.values()) {
      handler(resource);
    }
    return resource;
  }
}
