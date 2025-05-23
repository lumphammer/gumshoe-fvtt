import * as c from "../../constants";
import { InvestigatorActor } from "../InvestigatorActor";

import StringField = foundry.data.fields.StringField;
import ArrayField = foundry.data.fields.ArrayField;

export const partySchema = {
  // abilityNames: string[];
  abilityNames: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
  // actorIds: string[];
  actorIds: new ArrayField(new StringField(), {
    nullable: false,
    required: true,
  }),
};

export class PartyModel extends foundry.abstract.TypeDataModel<
  typeof partySchema,
  InvestigatorActor<"party">
> {
  static defineSchema(): typeof partySchema {
    return partySchema;
  }
}

export type PartyActor = InvestigatorActor<typeof c.party>;

export const isPartyActor = (x: unknown): x is PartyActor =>
  x instanceof InvestigatorActor && x.type === c.party;

function _f(x: PartyModel) {
  console.log(x.abilityNames[0]);
}
