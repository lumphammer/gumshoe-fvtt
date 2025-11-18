// enabling this rule because ts 5.5.x is having some issues with deep types
// that seem to come out here
/* eslint "@typescript-eslint/explicit-function-return-type": "error" */

import { settings } from "../../settings/settings";
import { NoteWithFormat } from "../../types";
import { isActiveCharacterActor } from "../actors/exports";

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

  getThemeName(): string {
    const systemThemeName = settings.defaultThemeName.get();
    const actor = this.actor;
    if (this.isOwned && actor && isActiveCharacterActor(actor)) {
      return actor.system.getSheetThemeName() || systemThemeName;
    } else {
      return systemThemeName;
    }
  }

  getNotes = (): NoteWithFormat | undefined => {
    const system = this.system;
    const notes =
      "notes" in system ? (system.notes as NoteWithFormat) : undefined;
    return (
      notes ?? {
        format: "richText",
        source: "",
        html: "",
      }
    );
  };
}
