// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */

export class InvestigatorActor<
  SubType extends Actor.SubType = Actor.SubType,
> extends Actor<SubType> {
  constructor(data: Actor.CreateData, context?: Actor.ConstructionContext) {
    super(data, context);
    // @ts-expect-error fvtt-types
    this.type = data.type as SubType;
  }

  override type!: SubType;

  setName = (name: string): Promise<this | undefined> => {
    return this.update({ name });
  };
}
