import { assertGame } from "../../functions/isGame";
import { systemLogger } from "../../functions/utilities";
import {
  ArrayField,
  BooleanField,
  DataModel,
  NumberField,
  SchemaField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { settings } from "../../settings/settings";
import { ClassicCombatant, isClassicCombatant } from "./classicCombatant";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { InvestigatorCombatant } from "./InvestigatorCombatant";
import { isValidCombat, ValidCombatModel } from "./types";

function compareCombatants(
  a: InvestigatorCombatant,
  b: InvestigatorCombatant,
): number {
  if (settings.useTurnPassingInitiative.get()) {
    return a.name && b.name ? a.name.localeCompare(b.name) : 0;
  } else {
    return (b.system.initiative ?? 0) - (a.system.initiative ?? 0);
  }
}

// /////////////////////////////////////////////////////////////////////////////
// Schema Definition

type RoundInfo = SchemaField.InitializedData<typeof roundInfoField.fields>;

const turnInfoField = new SchemaField(
  {
    combatantId: new StringField({
      nullable: false,
      required: true,
      initial: "",
    }),
  },
  {
    nullable: false,
    required: true,
    initial: {},
  },
);

const turnArrayField = new ArrayField(turnInfoField, {
  nullable: false,
  required: true,
  initial: [],
});

const roundInfoField = new SchemaField(
  {
    turns: turnArrayField,
    turnIndex: new NumberField({
      nullable: true,
      required: true,
      initial: null,
    }),
    combatantsAreSorted: new BooleanField({
      nullable: false,
      required: true,
      initial: true,
    }),
  },
  { nullable: false, required: false, initial: undefined },
);

export const classicCombatSchema = {
  rounds: new ArrayField(roundInfoField, {
    nullable: false,
    required: true,
    initial: [],
  }),
};

/**
 * Combat subtype for classic GUMSHOE combat.
 * This is the default combat type used in most GUMSHOE games.
 */
export class ClassicCombatModel
  extends TypeDataModel<
    typeof classicCombatSchema,
    InvestigatorCombat<"classic">
  >
  implements ValidCombatModel
{
  constructor(
    ...[data, options]: DataModel.ConstructorArgs<
      typeof classicCombatSchema,
      ClassicCombat
    >
  ) {
    super(data, options);
  }

  static defineSchema(): typeof classicCombatSchema {
    return classicCombatSchema;
  }

  // ///////////////////////////////////////////////////////////////////////////
  // _preCreate
  override _preCreate(
    ...[data, options, user]: Parameters<
      TypeDataModel<typeof classicCombatSchema, ClassicCombat>["_preCreate"]
    >
  ) {
    systemLogger.log("ClassicCombatModel#_preCreate called");
    return super._preCreate(data, options, user);
  }

  // ///////////////////////////////////////////////////////////////////////////
  // onCreateDescendantDocuments
  async onCreateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      data,
      options,
      userId,
    ]: Combat.OnCreateDescendantDocumentsArgs
  ) {
    if (collection !== "combatants") {
      return;
    }
    systemLogger.log(
      "ClassicCombatModel#onCreateDescendantDocuments called",
      documents,
      data,
    );

    // get the round info
    const round = this.rounds[parent.round];
    // get the old turns
    const oldTurns = round ? [...round.turns] : [];
    // work out which turns have already passed
    const settledOldTurns = oldTurns.slice(0, (parent.turn ?? -1) + 1);
    // get a list of combatants who haven't gone yet
    const unsettledOldTurns = oldTurns.slice((parent.turn ?? -1) + 1);
    const unsettledOldCombatants = unsettledOldTurns
      .map((t) => parent.combatants.get(t.combatantId))
      .filter(isClassicCombatant);
    // get a list of who's been added
    const newCombatants: ClassicCombatant[] = (documents as unknown[]).filter(
      isClassicCombatant,
    );
    // shuffle then together
    const newRemainingCombatants = [
      // old ones first so they win a tie against new arrivals
      ...unsettledOldCombatants,
      ...newCombatants,
    ].sort(compareCombatants);

    // turn them back into turn info objects
    const newTurns = newRemainingCombatants.map((c) => ({ combatantId: c.id }));
    const turns = [...settledOldTurns, ...newTurns];

    // update
    await this.parent.update({
      system: {
        rounds: [
          ...this.rounds.slice(0, parent.round),
          {
            turns,
          },
          ...this.rounds.slice(parent.round + 1),
        ],
      },
    });
  }

  // not an override because foundry doesn't do this itself. we call this from
  // InvestigatorCombat#_onUpdateDescendantDocuments so the model can react to
  // changes in combatants.
  async onUpdateDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      changes,
      options,
      userId,
    ]: Combat.OnUpdateDescendantDocumentsArgs
  ) {
    systemLogger.log("ClassicCombatModel#_onUpdateDescendantDocuments called");
    // const oldRoundInfo = this.rounds[parent.round];
    assertGame(game);
    if (!isValidCombat(parent) || userId !== game.userId) {
      return;
    }
    // This is where we want to react to changes in combatants.
    // if (collection === game.combatants) {}
    return Promise.resolve();
  }

  async onDeleteDescendantDocuments(
    ...[
      parent,
      collection,
      documents,
      ids,
      options,
      userId,
    ]: Combat.OnDeleteDescendantDocumentsArgs
  ) {
    systemLogger.log("ClassicCombat#onDeleteDescendantDocuments called");
    if (collection !== "combatants") {
      return;
    }
    const oldRound = this.rounds[parent.round];
    if (oldRound === undefined) {
      return;
    }
    const turns =
      oldRound.turns.filter((t) => !ids.includes(t.combatantId)) ?? [];

    const rounds = [...this.rounds];
    rounds[parent.round] = {
      combatantsAreSorted: oldRound.combatantsAreSorted,
      turnIndex: oldRound.turnIndex,
      turns,
    };

    await this.parent.update({ system: { rounds } });

    return Promise.resolve();
  }

  getTurns(): string[] {
    const turns =
      this.rounds[this.parent.round]?.turns.map((t) => t.combatantId) ?? [];
    systemLogger.log("Returning turns", turns);
    return turns;
  }

  // onCombatStart: copy the turns from round 0
  async startCombat() {
    systemLogger.log("ClassicCombatModel#startCombat called");
    if (this.parent.combatants.size === 0) {
      return;
    }
    const oldRound = this.rounds[0];
    if (oldRound === undefined) {
      return;
    }
    const turnIndex = 0;
    const roundIndex = 1;
    const roundInfo: RoundInfo = {
      turnIndex,
      turns: oldRound.turns,
      combatantsAreSorted: oldRound.combatantsAreSorted,
    };
    const rounds = [...(this.rounds ?? [])];
    rounds[roundIndex] = roundInfo;
    const updateData = {
      round: roundIndex,
      turn: turnIndex,
      system: { rounds },
    };
    Hooks.callAll("combatStart", this.parent, {
      round: roundIndex,
      turn: turnIndex,
    });
    await this.parent.update(updateData);
  }

  getNewRoundInfo(): RoundInfo {
    systemLogger.log("ClassicCombatModel#getNewRound called");
    const turnIndex = 0;
    const turns = this.parent.combatants.contents
      .sort(compareCombatants)
      .flatMap((c) => (c.id === null ? [] : [{ combatantId: c.id }]));

    const roundInfo: RoundInfo = {
      turnIndex,
      turns,
      combatantsAreSorted: true,
    };
    return roundInfo;
  }

  getExistingRoundInfo(oldRoundInfo: RoundInfo) {
    // remove combatants who no longer exist
    const turns = [...oldRoundInfo.turns].filter((t) =>
      this.parent.combatants.has(t.combatantId),
    );

    // find combatants who are not in round, sort them, and add them to the end.
    const newCombatants = this.parent.combatants.contents
      .filter((c) => !turns.some((t) => t.combatantId === c.id))
      .sort(compareCombatants)
      .flatMap((c) => (c.id === null ? [] : [{ combatantId: c.id }]));

    turns.push(...newCombatants);

    // turnIndex
    let turnIndex = oldRoundInfo.turnIndex;
    if (turnIndex !== null) {
      const previousCombatantIndex = turns.findIndex(
        (t) =>
          oldRoundInfo.turnIndex !== null &&
          t.combatantId ===
            oldRoundInfo.turns[oldRoundInfo.turnIndex].combatantId,
      );
      if (previousCombatantIndex === -1) {
        turnIndex = Math.min(turnIndex, turns.length - 1);
      } else {
        turnIndex = previousCombatantIndex;
      }
    }

    // calculate `isSorted`
    const initiatives = turns.map(
      (t) => this.parent.combatants.get(t.combatantId)?.system.initiative ?? 0,
    );
    const combatantsAreSorted = initiatives.every(
      (initiative, i) => i === 0 || initiative > initiatives[i - 1],
    );

    const newRoundInfo: RoundInfo = {
      turnIndex,
      turns,
      combatantsAreSorted,
    };
    return newRoundInfo;
  }

  async gotoRound(roundIndex: number) {
    const existingRound = this.rounds[roundIndex];
    const roundInfo = existingRound
      ? this.getExistingRoundInfo(existingRound)
      : this.getNewRoundInfo();
    const rounds = [...(this.rounds ?? [])];
    rounds[roundIndex] = roundInfo;
    const updateData = {
      round: roundIndex,
      turn: roundInfo.turnIndex,
      system: { rounds },
    };
    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      roundIndex,
      roundInfo.turnIndex,
    );

    // Update the document, passing data through a hook first
    const updateOptions = {
      direction: roundIndex > this.parent.round ? (1 as const) : (-1 as const),
      worldTime: { delta: advanceTime },
    };

    // @ts-expect-error fvtt-types
    Hooks.callAll("combatRound", this.parent, updateData, updateOptions);
    type _T = Parameters<typeof this.parent.update>[0];
    await this.parent.update(updateData, updateOptions);
  }

  async nextRound() {
    systemLogger.log("ClassicCombatModel#nextRound called");
    const roundIndex = this.parent.round + 1;
    await this.gotoRound(roundIndex);
  }

  async previousRound() {
    systemLogger.log("ClassicCombatModel#previousRound called");
    if (this.parent.round === 0) return;
    const roundIndex = this.parent.round - 1;
    await this.gotoRound(roundIndex);
  }

  async nextTurn() {
    systemLogger.log("ClassicCombatModel#nextTurn called");

    if (this.parent.round === 0) {
      await this.nextRound();
      return;
    }

    const turn = this.parent.turn ?? -1;

    const combatants = this.parent.combatants.contents;

    // Determine the next turn number
    let nextTurn: number | null = null;
    if (this.parent.settings.skipDefeated) {
      for (let i = turn + 1; i < combatants.length; i++) {
        if (!combatants[i].isDefeated) {
          nextTurn = i;
          break;
        }
      }
    } else {
      nextTurn = turn + 1;
    }

    // Maybe advance to the next round
    if (nextTurn === null || nextTurn >= combatants.length) {
      return this.nextRound();
    }

    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      this.parent.round,
      nextTurn,
    );

    // Update the document, passing data through a hook first
    const updateData = { round: this.parent.round, turn: nextTurn };
    const updateOptions = {
      direction: 1 as const,
      worldTime: { delta: advanceTime },
    };
    // @ts-expect-error fvtt-types
    Hooks.callAll(
      //
      "combatTurn",
      this,
      updateData,
      updateOptions,
    );
    await this.parent.update(updateData, updateOptions);
  }

  async previousTurn() {
    systemLogger.log("ClassicCombatModel#previousTurn called");
    if (this.parent.round === 0) return;
    if (this.parent.turn === 0 || this.parent.combatants.size === 0) {
      await this.previousRound();
      return;
    }
    const previousTurn = (this.parent.turn ?? this.parent.combatants.size) - 1;
    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      this.parent.round,
      previousTurn,
    );

    // Update the document, passing data through a hook first
    const updateData = { round: this.parent.round, turn: previousTurn };
    const updateOptions = {
      direction: -1 as const,
      worldTime: { delta: advanceTime },
    };
    // @ts-expect-error fvtt-types
    Hooks.callAll(
      //
      "combatTurn",
      this,
      updateData,
      updateOptions,
    );
    await this.parent.update(updateData, updateOptions);
  }
}

export type ClassicCombat = InvestigatorCombat<"classic">;

export function isClassicCombat(x: unknown): x is ClassicCombat {
  return x instanceof InvestigatorCombat && x.type === "classic";
}

export function assertClassicCombat(x: unknown): asserts x is ClassicCombat {
  if (!isClassicCombat(x)) {
    throw new Error("Expected combat to be a ClassicCombat");
  }
}
