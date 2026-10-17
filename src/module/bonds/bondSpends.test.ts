import { describe, expect, it } from "vitest";

import { parseBondSpends, serializeBondSpends } from "./bondSpends";

describe("serializeBondSpends", () => {
  it("leaves out Bonds with nothing spent", () => {
    expect(
      serializeBondSpends([
        { name: "Mom", spend: 2 },
        { name: "Jerome", spend: 0 },
      ]),
    ).toBe('[{"name":"Mom","spend":2}]');
  });

  it("is null when nothing was spent", () => {
    expect(serializeBondSpends([{ name: "Mom", spend: 0 }])).toBeNull();
  });
});

describe("parseBondSpends", () => {
  it("round-trips", () => {
    const records = [
      { name: 'Temple "Beth-Israel"', spend: 1 },
      { name: "Mom", spend: 3 },
    ];
    expect(parseBondSpends(serializeBondSpends(records))).toEqual(records);
  });

  it.each([null, "", "not json", "{}", "[1, 2]", '[{"name": 3, "spend": 1}]'])(
    "reads %j as no spends",
    (text) => {
      expect(parseBondSpends(text)).toEqual([]);
    },
  );

  it("drops malformed records but keeps good ones", () => {
    expect(
      parseBondSpends('[{"name":"Mom","spend":2},{"name":"Dad","spend":-1}]'),
    ).toEqual([{ name: "Mom", spend: 2 }]);
  });
});
