import { expect, it } from "vitest";

import { getSpecialitiesCount, resizeSpecialities } from "./resizeSpecialities";

it.each([
  [false, "one", 3, 0],
  [false, "twoThreeFour", 3, 0],
  [true, "one", 0, 0],
  [true, "one", 3, 3],
  [true, "twoThreeFour", 0, 0],
  [true, "twoThreeFour", 1, 2],
  [true, "twoThreeFour", 2, 5],
  [true, "twoThreeFour", 3, 9],
] as const)(
  "counts specialities for hasSpecialities=%s, mode=%s, rating=%s",
  (hasSpecialities, specialitiesMode, rating, expected) => {
    expect(
      getSpecialitiesCount({ hasSpecialities, specialitiesMode, rating }),
    ).toBe(expected);
  },
);

it("preserves all valid specialities when an NBA-style rating changes", () => {
  const specialities = ["A", "B", "C", "D", "E"];

  expect(
    resizeSpecialities(specialities, {
      hasSpecialities: true,
      specialitiesMode: "twoThreeFour",
      rating: 2,
    }),
  ).toEqual(specialities);
});
