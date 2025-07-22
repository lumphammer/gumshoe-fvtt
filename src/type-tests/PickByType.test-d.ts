import { describe, expectTypeOf, it } from "vitest";

import { PickByType } from "../types";

interface Foo {
  a: number;
  b: string;
  c: string;
}
type PickByTypeOfFooStrings = PickByType<Foo, string>;
type PickByTypeOfFooNumbers = PickByType<Foo, number>;
describe("PickByTypeOfFooStrings", () => {
  it("can be assigned various things", () => {
    expectTypeOf<PickByTypeOfFooStrings>().toExtend<object>();
    expectTypeOf({}).not.toExtend<PickByTypeOfFooStrings>();
    expectTypeOf({ a: 1 }).not.toExtend<PickByTypeOfFooStrings>();
    expectTypeOf({ a: "1" }).not.toExtend<PickByTypeOfFooStrings>();
    expectTypeOf({
      a: "1",
      b: 2,
    }).not.toExtend<PickByTypeOfFooStrings>();
    expectTypeOf({
      a: "1",
      b: "2",
    }).not.toExtend<PickByTypeOfFooStrings>();
    expectTypeOf({ b: "2", c: "3" }).toExtend<PickByTypeOfFooStrings>();
  });
});
describe("PickByTypeOfFooNumbers", () => {
  it("can be assigned various things", () => {
    //
    expectTypeOf<PickByTypeOfFooNumbers>().toExtend<object>();
    expectTypeOf({}).not.toExtend<PickByTypeOfFooNumbers>();
    expectTypeOf({ a: 1 }).toExtend<PickByTypeOfFooNumbers>();
    expectTypeOf({ a: "1" }).not.toExtend<PickByTypeOfFooNumbers>();
    expectTypeOf({
      a: "1",
      b: 2,
    }).not.toExtend<PickByTypeOfFooNumbers>();
    expectTypeOf({
      a: "1",
      b: "2",
    }).not.toExtend<PickByTypeOfFooNumbers>();
    expectTypeOf({
      b: "2",
      c: "3",
    }).not.toExtend<PickByTypeOfFooNumbers>();
  });
});
