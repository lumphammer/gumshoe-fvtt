import { assertGame } from "../../functions/isGame";
import { systemLogger } from "../../functions/utilities";
import {
  ArrayField,
  DataModel,
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

type RoundField = SchemaField.InitializedData<typeof roundField.fields>;

const turnField = new SchemaField(
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

const turnArrayField = new ArrayField(turnField, {
  nullable: false,
  required: true,
  initial: [],
});

const roundField = new SchemaField(
  {
    turns: turnArrayField,
    jumpIns: new ArrayField(
      new StringField({
        nullable: false,
        required: true,
      }),
      {
        nullable: false,
        required: true,
        initial: [],
      },
    ),
  },
  { nullable: true, required: false },
);

export const classicCombatSchema = {
  rounds: new ArrayField(roundField, {
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
    const turns = this.parent.combatants.contents
      .sort(compareCombatants)
      .map((c) => ({ combatantId: c.id }));
    this.updateSource({
      rounds: [
        {
          turns,
        },
      ],
    });
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

    const round = this.rounds[parent.round];
    const oldTurns = [...round.turns];
    const settledOldTurns = oldTurns.slice(0, (parent.turn ?? -1) + 1);
    const unsettledOldTurns = oldTurns.slice((parent.turn ?? -1) + 1);
    const unsettledOldCombatants = unsettledOldTurns
      .map((t) => parent.combatants.get(t.combatantId))
      .filter(isClassicCombatant);
    const newCombatants: ClassicCombatant[] = (documents as unknown[]).filter(
      isClassicCombatant,
    );
    const newRemainingCombatants = [
      // old ones first so they win a tie against new arrivals
      ...unsettledOldCombatants,
      ...newCombatants,
    ].sort(compareCombatants);

    const newTurns = newRemainingCombatants.map((c) => ({ combatantId: c.id }));

    const turns = [...settledOldTurns, ...newTurns];

    await this.parent.update({
      system: {
        rounds: [
          ...this.rounds.slice(0, parent.round),
          {
            turns,
            jumpIns: round.jumpIns,
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
    assertGame(game);
    if (!isValidCombat(parent) || userId !== game.userId) {
      return;
    }
    // This is where we want to react to changes in combatants.
    // if (collection === game.combatants) {}
    return Promise.resolve();
  }

  async onDeleteDescendantDocuments(
    ...args: Combat.OnDeleteDescendantDocumentsArgs
  ) {
    systemLogger.log("ClassicCombat#onDeleteDescendantDocuments called");
    return Promise.resolve();
  }

  getTurns(): string[] {
    const turns =
      this.rounds[this.parent.round]?.turns.map((t) => t.combatantId) ?? [];
    systemLogger.log("Returning turns", turns);
    return turns;
  }

  async startCombat() {
    systemLogger.log("ClassicCombatModel#startCombat called");
    const round: RoundField = {
      jumpIns: [],
      turns: this.parent.combatants.contents
        .sort(compareCombatants)
        .flatMap((c) => (c.id === null ? [] : [{ combatantId: c.id }])),
    };
    const rounds = [...(this.rounds ?? [])];
    rounds[1] = round;
    const updateData = { round: 1, turn: 0, system: { rounds } };
    Hooks.callAll("combatStart", this.parent, updateData);
    await this.parent.update(updateData);
  }

  async nextRound() {
    systemLogger.log("ClassicCombatModel#nextRound called");
    const turn = 0;
    const roundNumber = this.parent.round + 1;
    const roundField: RoundField = {
      jumpIns: [],
      turns: this.parent.combatants.contents
        .sort(compareCombatants)
        .flatMap((c) => (c.id === null ? [] : [{ combatantId: c.id }])),
    };
    const rounds = [...(this.rounds ?? [])];
    rounds[roundNumber] = roundField;

    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      roundNumber,
      turn,
    );

    // Update the document, passing data through a hook first
    const updateData = { round: roundNumber, turn, system: { rounds } };
    const updateOptions = {
      direction: 1 as const,
      worldTime: { delta: advanceTime },
    };
    // @ts-expect-error fvtt-types
    Hooks.callAll(
      // this comment is just to keep the @ts-expect-error above isolated
      "combatRound",
      this.parent,
      updateData,
      updateOptions,
    );
    await this.parent.update(updateData, updateOptions);
  }

  async previousRound() {
    systemLogger.log("ClassicCombatModel#previousRound called");
    // await this.parent.update({ round: this.parent.round - 1 });

    const previousRound = this.parent.round - 1;

    if (previousRound < 0) {
      return;
    }
    const turn =
      previousRound === 0 || this.parent.combatants.size === 0
        ? null
        : this.parent.combatants.size - 1;
    const advanceTime = this.parent.getTimeDelta(
      this.parent.round,
      this.parent.turn,
      previousRound,
      turn,
    );
    const roundField: RoundField = {
      jumpIns: [],
      turns: this.parent.combatants.contents
        .sort(compareCombatants)
        .flatMap((c) => (c.id === null ? [] : [{ combatantId: c.id }])),
    };
    const rounds = [...(this.rounds ?? [])];
    rounds[previousRound] = roundField;

    // Update the document, passing data through a hook first
    const updateData = { round: previousRound, turn, system: { rounds } };
    const updateOptions = {
      direction: -1 as const,
      worldTime: { delta: advanceTime },
    };
    // @ts-expect-error fvtt-types
    Hooks.callAll(
      //
      "combatRound",
      this,
      updateData,
      updateOptions,
    );
    await this.parent.update(updateData, updateOptions);
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
