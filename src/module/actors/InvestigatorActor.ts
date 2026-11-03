// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */

import { getEditedBarValue } from "../tokenBars";

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

  /**
   * Link new PCs' tokens to the actor, so damage and pool changes on a token
   * show up on the character sheet. Leaves alone PCs which say otherwise
   * (e.g. duplicates and imports of unlinked ones).
   */
  protected override async _preCreate(
    data: Actor.CreateData,
    options: Actor.Database.PreCreateOptions,
    user: User.Stored,
  ): Promise<boolean | void> {
    if (
      data.type === "pc" &&
      foundry.utils.getProperty(data, "prototypeToken.actorLink") === undefined
    ) {
      this.updateSource({ prototypeToken: { actorLink: true } });
    }
    return super._preCreate(data, options, user);
  }
}
