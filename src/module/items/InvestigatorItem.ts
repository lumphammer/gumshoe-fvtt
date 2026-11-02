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
    return this.update({
      name,
    });
  };
}
