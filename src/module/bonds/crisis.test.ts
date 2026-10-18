import { describe, expect, it } from "vitest";

import type { CrisisBond, CrisisRecord } from "./crisis";
import {
  areCrisisLossesValid,
  findBondWith,
  getBondAfterLoss,
  getNewDeltaGreenBondRating,
  parseCrisisCall,
  parseCrisisRecord,
  serializeCrisisCall,
  planCrisis,
  serializeCrisisRecord,
} from "./crisis";

const bond = (
  name: string,
  points: number,
  extra: Partial<CrisisBond> = {},
): CrisisBond => ({
  id: name,
  name,
  points,
  isDeltaGreen: false,
  actorUuid: null,
  ...extra,
});

const bob = { uuid: "Actor.bob", name: "Bob" };
const carlos = { uuid: "Actor.carlos", name: "Carlos" };

describe("getNewDeltaGreenBondRating", () => {
  it.each([
    [[4, 3], 2],
    [[3], 2],
    [[1], 1],
    [[], 0],
    // only broken ones
    [[-1], 0],
  ])("highest of %j: %i", (points, expected) => {
    expect(
      getNewDeltaGreenBondRating(points.map((p, i) => bond(`b${i}`, p))),
    ).toBe(expected);
  });

  it("counts DELTA GREEN Bonds too", () => {
    expect(
      getNewDeltaGreenBondRating([
        bond("Zorah", 1),
        bond("Bob", 4, { isDeltaGreen: true }),
      ]),
    ).toBe(2);
  });
});

describe("findBondWith", () => {
  it("prefers an unbroken DELTA GREEN Bond, then any unbroken one", () => {
    const broken = bond("Bob (old)", -1, { actorUuid: bob.uuid });
    const ordinary = bond("Bob (cousin)", 2, { actorUuid: bob.uuid });
    const dg = bond("Bob", 1, { actorUuid: bob.uuid, isDeltaGreen: true });
    expect(findBondWith([broken, ordinary, dg], bob)).toBe(dg);
    expect(findBondWith([broken, ordinary], bob)).toBe(ordinary);
    expect(findBondWith([broken], bob)).toBe(broken);
    expect(findBondWith([bond("Mom", 3)], bob)).toBeUndefined();
  });
});

describe("planCrisis", () => {
  it("follows the book's first example: two new Bonds cost one point", () => {
    const plan = planCrisis(
      [bond("Zorah", 4), bond("Jerome", 4)],
      [bob, carlos],
    );
    expect(plan.newRating).toBe(2);
    expect(plan.changes).toEqual([
      { kind: "new", teammate: bob, after: 2 },
      { kind: "new", teammate: carlos, after: 2 },
    ]);
    expect(plan.lossesOwed).toBe(1);
    expect(plan.lossesRequired).toBe(1);
  });

  it("follows the book's second example: one point per Bond strengthened", () => {
    const bobBond = bond("Bob", 2, { isDeltaGreen: true, actorUuid: bob.uuid });
    const carlosBond = bond("Carlos", 2, {
      isDeltaGreen: true,
      actorUuid: carlos.uuid,
    });
    const plan = planCrisis(
      [bond("Night shift", 4), bond("Jerome", 4), bobBond, carlosBond],
      [bob, carlos],
    );
    expect(plan.changes).toEqual([
      { kind: "strengthen", teammate: bob, bond: bobBond, after: 3 },
      { kind: "strengthen", teammate: carlos, bond: carlosBond, after: 3 },
    ]);
    expect(plan.lossesOwed).toBe(2);
    // only the ordinary Bonds pay
    expect(plan.candidates.map((c) => c.bond.name)).toEqual([
      "Night shift",
      "Jerome",
    ]);
  });

  it("re-forms a broken Bond as a new one, sharing the one-point cost", () => {
    const gone = bond("Bob", -1, { isDeltaGreen: true, actorUuid: bob.uuid });
    const plan = planCrisis([bond("Mom", 3), gone], [bob, carlos]);
    expect(plan.changes).toEqual([
      { kind: "reform", teammate: bob, bond: gone, after: 2 },
      { kind: "new", teammate: carlos, after: 2 },
    ]);
    expect(plan.lossesOwed).toBe(1);
  });

  it("strengthens no higher than 4, but it still costs", () => {
    const bobBond = bond("Bob", 4, { isDeltaGreen: true, actorUuid: bob.uuid });
    const plan = planCrisis([bond("Mom", 3), bobBond], [bob]);
    expect(plan.changes[0].after).toBe(4);
    expect(plan.lossesOwed).toBe(1);
  });

  it("doesn't take the cost from a Bond the crisis is about", () => {
    // Bob is also family: an ordinary Bond, strengthened
    const cousin = bond("Cousin Bob", 2, { actorUuid: bob.uuid });
    const plan = planCrisis([bond("Mom", 3), cousin], [bob]);
    expect(plan.changes[0]).toMatchObject({ kind: "strengthen", after: 3 });
    expect(plan.candidates.map((c) => c.bond.name)).toEqual(["Mom"]);
  });

  it("only takes what's left: other Bonds can go down to broken", () => {
    const bobBond = bond("Bob", 2, { isDeltaGreen: true, actorUuid: bob.uuid });
    const carlosBond = bond("Carlos", 2, {
      isDeltaGreen: true,
      actorUuid: carlos.uuid,
    });
    const plan = planCrisis(
      [bond("Mom", 0), bond("Gone", -1), bobBond, carlosBond],
      [bob, carlos, { uuid: "Actor.dana", name: "Dana" }],
    );
    // 1 for Dana, 2 for Bob and Carlos, but Mom can only lose 1
    expect(plan.lossesOwed).toBe(3);
    expect(plan.lossesRequired).toBe(1);
    expect(plan.candidates).toEqual([{ bond: bond("Mom", 0), maxLoss: 1 }]);
  });

  it("costs nothing with nobody to bond with", () => {
    const plan = planCrisis([bond("Mom", 3)], []);
    expect(plan.lossesOwed).toBe(0);
  });
});

describe("areCrisisLossesValid", () => {
  const plan = planCrisis(
    [
      bond("Mom", 3),
      bond("Jerome", 1),
      bond("Bob", 2, { isDeltaGreen: true, actorUuid: bob.uuid }),
      bond("Carlos", 2, { isDeltaGreen: true, actorUuid: carlos.uuid }),
    ],
    [bob, carlos],
  );

  it.each([
    ["split", { Mom: 1, Jerome: 1 }, true],
    ["both from one Bond", { Mom: 2 }, true],
    ["down to broken", { Jerome: 2 }, true],
    ["past broken", { Jerome: 3 }, false],
    ["too few", { Mom: 1 }, false],
    ["too many", { Mom: 2, Jerome: 1 }, false],
    ["from a DELTA GREEN Bond", { Mom: 1, Bob: 1 }, false],
    ["from an unknown Bond", { Mom: 1, Nobody: 1 }, false],
    ["negative", { Mom: 3, Jerome: -1 }, false],
    ["zeroes are fine", { Mom: 2, Jerome: 0, Bob: 0 }, true],
  ])("%s", (_, losses, expected) => {
    expect(areCrisisLossesValid(plan, losses)).toBe(expected);
  });
});

describe("getBondAfterLoss", () => {
  it.each([
    [3, 1, 2],
    [0, 1, -1],
    [0, 3, -1],
  ])("%i losing %i: %i", (points, loss, expected) => {
    expect(getBondAfterLoss(points, loss)).toBe(expected);
  });
});

describe("parseCrisisRecord", () => {
  const record: CrisisRecord = {
    difficulty: 4,
    die: 2,
    total: 3,
    succeeded: false,
    spends: [{ name: "Stability", spend: 1 }],
    changes: [
      { kind: "new", name: "Carlos", before: null, after: 2 },
      { kind: "strengthen", name: "Bob", before: 2, after: 3 },
    ],
    losses: [{ name: "Mom", before: 3, after: 1 }],
  };

  it("round-trips", () => {
    expect(parseCrisisRecord(serializeCrisisRecord(record))).toEqual(record);
  });

  it.each([
    ["missing", null],
    ["not JSON", "{"],
    ["a bad kind", JSON.stringify({ ...record, changes: [{ kind: "x" }] })],
    ["a bad loss", JSON.stringify({ ...record, losses: [{ name: "Mom" }] })],
    ["no outcome", JSON.stringify({ ...record, succeeded: undefined })],
  ])("rejects %s", (_, text) => {
    expect(parseCrisisRecord(text)).toBeNull();
  });
});

describe("parseCrisisCall", () => {
  it("round-trips", () => {
    const call = { members: [bob, carlos] };
    expect(parseCrisisCall(serializeCrisisCall(call))).toEqual(call);
  });

  it.each([
    ["missing", null],
    ["not JSON", "{"],
    ["no members", "{}"],
    ["a bad member", JSON.stringify({ members: [{ uuid: 1 }] })],
  ])("rejects %s", (_, text) => {
    expect(parseCrisisCall(text)).toBeNull();
  });
});
