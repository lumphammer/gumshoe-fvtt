import * as c from "../../constants";
import { createKeyedQueue } from "../../functions/createKeyedQueue";
import { assertGame } from "../../functions/isGame";
import { ArrayField, StringField, TypeDataModel } from "../../fvtt-exports";
import { InvestigatorActor } from "./InvestigatorActor";
import { isPCActor } from "./pc";

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

/**
 * Changes to a party's members, one at a time per party. Each reads the
 * members and writes them back, so two at once (e.g. two quick drops) would
 * lose one.
 */
const runExclusive = createKeyedQueue();

export class PartyModel extends TypeDataModel<
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
      .filter((actor) => actor !== undefined);
  };

  /**
   * The members as they are now. (After an update, the actor may have a new
   * `system`, so read it from the actor, not `this`.)
   */
  private getCurrentActorIds = (): string[] => this.parent.system.actorIds;

  addActorIds = (newIds: string[]) =>
    runExclusive(this.parent.uuid ?? "", () => this.addActorIdsNow(newIds));

  private addActorIdsNow = async (newIds: string[]) => {
    const currentIds = this.getCurrentActorIds();
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

  removeActorId = (id: string) =>
    runExclusive(this.parent.uuid ?? "", () =>
      this.setActorIds(this.getCurrentActorIds().filter((x) => x !== id)),
    );
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
