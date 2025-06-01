import * as c from "../../constants";
import { assertGame } from "../../functions/utilities";
import { InvestigatorActor } from "./InvestigatorActor";
import { isPCActor } from "./pc";

import StringField = foundry.data.fields.StringField;
import ArrayField = foundry.data.fields.ArrayField;

export const partySchema = {
  abilityNames: new ArrayField(
    new StringField({ nullable: false, required: true }),
    { nullable: false, required: true },
  ),
  actorIds: new ArrayField(
    new StringField({ nullable: false, required: true }),
    { nullable: false, required: true },
  ),
};

export class PartyModel extends foundry.abstract.TypeDataModel<
  typeof partySchema,
  InvestigatorActor<"party">
> {
  static defineSchema(): typeof partySchema {
    return partySchema;
  }

  getActorIds = (): string[] => {
    return this.actorIds;
  };

  setActorIds = async (actorIds: string[]) => {
    await this.parent.update({ system: { actorIds } });
  };

  getActors = (): Actor[] => {
    return this.getActorIds()
      .map((id) => {
        assertGame(game);
        return game.actors?.get(id);
      })
      .filter((actor) => actor !== undefined) as Actor[];
  };

  addActorIds = async (newIds: string[]) => {
    const currentIds = this.getActorIds();
    const newActors = newIds.map((id) => {
      return game.actors?.get(id);
    }) as Actor[]; // cast prevents excessively deep etc etc.
    const filteredActors = newActors.filter((actor) => {
      const id = actor?.id;
      return (
        actor !== undefined &&
        isPCActor(actor) &&
        id !== null &&
        !currentIds.includes(id)
      );
    });
    const effectiveIds = filteredActors.map((actor) => actor.id) as string[];
    return this.setActorIds([...currentIds, ...effectiveIds]);
  };

  removeActorId = async (id: string) => {
    await this.setActorIds(this.getActorIds().filter((x) => x !== id));
  };
}

export type PartyActor = InvestigatorActor<typeof c.party>;

export function isPartyActor(x: unknown): x is PartyActor {
  return x instanceof InvestigatorActor && x.type === c.party;
}

export function assertPartyActor(x: unknown): asserts x is PartyActor {
  if (!isPartyActor(x)) {
    throw new Error("Expected a Party actor");
  }
}
