type ResourceHandler = (resource: number | string | null) => void;

/**
 * Handlers registered with `registerResourceHandler`, per combatant. These
 * can't live in a class field: Foundry prepares a document's data (which
 * calls `updateResource`) in its constructor, before our fields are set up.
 */
const resourceHandlers = new WeakMap<object, Set<ResourceHandler>>();

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
    user: User.Stored,
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
    documents: Combatant.Stored[],
    operation: Combatant.Database.PreUpdateOperation,
    user: User.Stored,
  ) {
    return super._preUpdateOperation(documents, operation, user);
  }

  protected static override async _onUpdateOperation(
    documents: Combatant.Stored[],
    operation: Combatant.Database.OnUpdateOperation,
    user: User.Stored,
  ) {
    return super._onUpdateOperation(documents, operation, user);
  }

  // add a new handler
  registerResourceHandler(handler: ResourceHandler): () => void {
    let handlers = resourceHandlers.get(this);
    if (handlers === undefined) {
      handlers = new Set();
      resourceHandlers.set(this, handlers);
    }
    handlers.add(handler);
    handler(this.resource);
    return () => handlers.delete(handler);
  }

  override updateResource() {
    const resource = super.updateResource();
    for (const handler of resourceHandlers.get(this) ?? []) {
      handler(resource);
    }
    return resource;
  }
}
