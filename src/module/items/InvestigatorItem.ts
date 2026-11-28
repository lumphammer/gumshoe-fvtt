// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class InvestigatorItem<
  SubType extends Item.SubType = Item.SubType,
> extends Item<SubType> {
  setName = (name: string): Promise<this | undefined> => {
    // Foundry refuses a blank name (with an error)
    if (name.trim() === "") return Promise.resolve(undefined);
    return this.update({
      name,
    });
  };
}
