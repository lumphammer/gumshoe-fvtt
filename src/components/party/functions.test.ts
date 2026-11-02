import { describe, expect, it } from "vitest";

import { buildRowData } from "./functions";
import type {
  AbilityRowData,
  PartyAbilityView,
  PartyMemberView,
} from "./types";
import { isCategoryHeader, isTypeHeader } from "./types";

const ability = (
  name: string,
  rating: number,
  extra: Partial<PartyAbilityView> = {},
): PartyAbilityView => ({
  uuid: `Compendium.x.Item.${name}`,
  type: "generalAbility",
  name,
  categoryId: "General",
  rating,
  ...extra,
});

const member = (
  id: string,
  abilities: PartyAbilityView[],
): PartyMemberView => ({
  id,
  name: id,
  img: null,
  abilities: abilities.map((a) => ({
    ...a,
    uuid: `Actor.${id}.Item.${a.name}`,
  })),
});

const abilityRows = (rows: ReturnType<typeof buildRowData>) =>
  rows.filter(
    (row): row is AbilityRowData =>
      !isTypeHeader(row) && !isCategoryHeader(row),
  );

describe("buildRowData", () => {
  it("adds up each pack ability's ratings, by exact name and type", () => {
    const rows = buildRowData(
      [ability("Athletics", 0), ability("Scuffling", 0)],
      [
        member("alice", [ability("Athletics", 2)]),
        member("bob", [
          ability("Athletics", 3),
          ability("Scuffling", 1, { type: "investigativeAbility" }),
        ]),
      ],
    );
    const athletics = abilityRows(rows).find(
      (row) => row.ability.name === "Athletics",
    )!;
    expect(athletics.total).toBe(5);
    expect(athletics.actorInfo["alice"]).toEqual({
      actorId: "alice",
      abilityUuid: "Actor.alice.Item.Athletics",
      rating: 2,
    });
    // bob's Scuffling is investigative, so it doesn't count for the general one
    const scuffling = abilityRows(rows).find(
      (row) => row.ability.name === "Scuffling" && !row.isExtra,
    )!;
    expect(scuffling.total).toBe(0);
    expect(scuffling.actorInfo["bob"].abilityUuid).toBeUndefined();
  });

  it("gives abilities only a member has their own row, from their copy", () => {
    const rows = buildRowData(
      [ability("Athletics", 0)],
      [member("alice", [ability("Unusual", 2)])],
    );
    const unusual = abilityRows(rows).find(
      (row) => row.ability.name === "Unusual",
    )!;
    expect(unusual.isExtra).toBe(true);
    expect(unusual.ability.uuid).toBe("Actor.alice.Item.Unusual");
    expect(unusual.total).toBe(2);
  });

  it("puts investigative abilities first, with each type's totals per member", () => {
    const rows = buildRowData(
      [
        ability("Athletics", 0),
        ability("Library Use", 0, {
          type: "investigativeAbility",
          categoryId: "Academic",
        }),
      ],
      [
        member("alice", [
          ability("Athletics", 2),
          ability("Library Use", 1, {
            type: "investigativeAbility",
            categoryId: "Academic",
          }),
        ]),
      ],
    );
    expect(rows.map((row) => row.rowType)).toEqual([
      "typeHeader",
      "categoryHeader",
      "abilityRowString",
      "typeHeader",
      "categoryHeader",
      "abilityRowString",
    ]);
    const [investigative, , , general] = rows;
    expect(investigative).toMatchObject({
      abilityType: "investigativeAbility",
      actorTotals: { alice: 1 },
      grandTotal: 1,
    });
    expect(general).toMatchObject({
      abilityType: "generalAbility",
      actorTotals: { alice: 2 },
      grandTotal: 2,
    });
  });
});
