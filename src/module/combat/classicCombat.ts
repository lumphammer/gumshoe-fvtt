import { systemLogger } from "../../functions/utilities";
import {
  ArrayField,
  DataModel,
  NumberField,
  SchemaField,
  StringField,
  TypeDataModel,
} from "../../fvtt-exports";
import { isClassicCombatant } from "./classicCombatant";
import { InvestigatorCombat } from "./InvestigatorCombat";
import { InvestigatorCombatant } from "./InvestigatorCombatant";
import { ValidCombatModel } from "./types";

function compareCombatants(
  a: InvestigatorCombatant,
  b: InvestigatorCombatant,
): number {
  return (b.system.initiative ?? 0) - (a.system.initiative ?? 0);
}

// /////////////////////////////////////////////////////////////////////////////
// Schema Definition

type RoundInfo = SchemaField.InitializedData<typeof roundInfoField.fields>;

type TurnInfo = SchemaField.InitializedData<typeof turnInfoField.fields>;

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
  },
  { nullable: false, required: false, initial: undefined },
);

export const classicCombatSchema = {
  rounds: new ArrayField(roundInfoField, {
    nullable: false,
    required: true,
    initial: [{ turns: [], turnIndex: null }],
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

  protected _areTurnsSorted(turns: TurnInfo[]): boolean {
    const initiatives = turns.map(
      (t) => this.parent.combatants.get(t.combatantId)?.system.initiative ?? 0,
    );
    const turnsAreSorted = initiatives.every(
      (initiative, i) => i === 0 || initiative > initiatives[i - 1],
    );
    return turnsAreSorted;
  }

  // ///////////////////////////////////////////////////////////////////////////
  // _preCreate
  override _preCreate(
    ...[data, options, user]: Parameters<
      TypeDataModel<typeof classicCombatSchema, ClassicCombat>["_preCreate"]
    >
  ) {
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
    if (round === undefined) {
      throw new Error("Round not found");
    }
    const newCombatants = (documents as unknown[]).filter(isClassicCombatant);

    let turns: TurnInfo[];
    if (this.parent.round === 0) {
      turns = this.parent.combatants.contents
        .sort(compareCombatants)
        .flatMap((c) =>
          c.id === null
            ? []
            : {
                combatantId: c.id,
              },
        );
    } else {
      const newTurns = newCombatants
        .sort(compareCombatants)
        .flatMap((c) => (c.id === null ? [] : { combatantId: c.id }));
      turns = [...round.turns, ...newTurns];
    }

    const rounds = [...this.rounds];
    rounds[parent.round] = {
      turnIndex: round.turnIndex,
      turns,
    };

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

    const turnIndex =
      oldRound.turnIndex === null
        ? null
        : Math.min(oldRound.turnIndex, turns.length - 1);

    const rounds = [...this.rounds];
    rounds[parent.round] = {
      turnIndex,
      turns,
    };

    await this.parent.update({ system: { rounds } });

    return Promise.resolve();
  }

  getTurns(): string[] {
    const turns =
      this.rounds[this.parent.round]?.turns.map((t) => t.combatantId) ?? [];
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

    const newRoundInfo: RoundInfo = {
      turnIndex,
      turns,
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
    Hooks.callAll(
      // this comment is here to isolate the ts-expect-error above
      "combatRound",
      this.parent,
      updateData,
      updateOptions,
    );
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

  /**
   * Advance to the next turn, or the next round if at the end of a round.
   */
  async nextTurn() {
    systemLogger.log("ClassicCombatModel#nextTurn called");

    if (this.parent.round === 0) {
      return await this.nextRound();
    }

    const roundInfo = this.rounds[this.parent.round];
    if (roundInfo === undefined) {
      return await this.gotoRound(this.parent.round);
    }

    // Determine the next turn number
    let nextTurnIndex =
      roundInfo.turnIndex === null ? 0 : roundInfo.turnIndex + 1;

    // Skip defeated combatants if the setting is enabled
    if (this.parent.settings.skipDefeated) {
      while (this.parent.combatants.contents[nextTurnIndex]?.isDefeated) {
        nextTurnIndex++;
      }
    }

    // Maybe advance to the next round
    if (nextTurnIndex >= this.parent.combatants.contents.length) {
      return await this.nextRound();
    }

    // create new rounds data
    roundInfo.turnIndex = nextTurnIndex;
    const rounds = [...this.rounds];
    rounds[this.parent.round] = roundInfo;

    // Update the document, passing data through a hook first
    const updateData = {
      round: this.parent.round,
      turn: nextTurnIndex,
      system: { rounds },
    };

    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      this.parent.round,
      nextTurnIndex,
    );

    const updateOptions = {
      direction: 1 as const,
      advanceTime, // docs and types say this...
      worldTime: {
        delta: advanceTime, // ...but the code in Combat suggests this
      },
    };
    Hooks.callAll("combatTurn", this.parent, updateData, updateOptions);
    await this.parent.update(updateData, updateOptions);
  }

  /**
   * Go to the previous turn, or the previous round if at the start of a round.
   */
  async previousTurn() {
    systemLogger.log("ClassicCombatModel#previousTurn called");
    if (this.parent.round === 0) return;
    const roundInfo = this.rounds[this.parent.round];
    if (roundInfo === undefined) {
      return await this.gotoRound(this.parent.round);
    }

    // Determine the next turn number
    let previousTurnIndex =
      roundInfo.turnIndex === null ? 0 : roundInfo.turnIndex - 1;

    // Skip defeated combatants if the setting is enabled
    if (this.parent.settings.skipDefeated) {
      while (this.parent.combatants.contents[previousTurnIndex]?.isDefeated) {
        previousTurnIndex--;
      }
    }

    // Maybe advance to the next round
    if (previousTurnIndex < 0) {
      return await this.previousRound();
    }

    // create new rounds data
    roundInfo.turnIndex = previousTurnIndex;
    const rounds = [...this.rounds];
    rounds[this.parent.round] = roundInfo;

    // Update the document, passing data through a hook first
    const updateData = {
      round: this.parent.round,
      turn: previousTurnIndex,
      system: { rounds },
    };

    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      this.parent.round,
      previousTurnIndex,
    );

    const updateOptions = {
      direction: -1 as const,
      advanceTime, // docs and types say this...
      worldTime: {
        delta: advanceTime, // ...but the code in Combat suggests this
      },
    };
    Hooks.callAll("combatTurn", this.parent, updateData, updateOptions);
    await this.parent.update(updateData, updateOptions);
  }

  async moveCombatant(active: string, over: string, direction: "up" | "down") {
    const roundInfo = this.rounds[this.parent.round];
    if (!roundInfo) return;
    const turnInfo = roundInfo.turns.find((t) => t.combatantId === active);
    if (!turnInfo) return;
    const turns = roundInfo.turns.filter((t) => t.combatantId !== active);
    const insertIndex =
      turns.findIndex((t) => t.combatantId === over) +
      (direction === "up" ? 0 : 1);
    // insert turnInfo into turns at insertIndex
    turns.splice(insertIndex, 0, turnInfo);
    const rounds = [...this.rounds];
    rounds[this.parent.round] = { ...roundInfo, turns };
    this.rounds = rounds;
    this.parent.setupTurns();
    // foundry.ui.combat.render();
    // game.combat?.apps.forEach((app) => app.render());
    await this.parent.update({ system: { rounds } });
  }

  async sortCombatants() {
    const roundInfo = this.rounds[this.parent.round];
    if (!roundInfo) return;
    const turns = roundInfo.turns
      .map(({ combatantId }) => this.parent.combatants.get(combatantId))
      .filter((c) => c !== undefined)
      .sort(compareCombatants)
      .flatMap((combatant) =>
        combatant.id
          ? [
              {
                combatantId: combatant.id,
              },
            ]
          : [],
      );
    const rounds = [...this.rounds];
    rounds[this.parent.round] = { ...roundInfo, turns };
    this.rounds = rounds;
    this.parent.setupTurns();
    await this.parent.update({ system: { rounds: this.rounds } });
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
