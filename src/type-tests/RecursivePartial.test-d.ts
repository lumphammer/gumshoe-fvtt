import { describe, expectTypeOf, it } from "vitest";

import { RecursivePartial, RecursiveRequired } from "../types";

// I've broken this out into a separate file because I was seeing some odd hangs
// when running vitest typecheck with multiple `describe` blocks in the same
// file.

// simple types to play with
type Basic = {
  bar: {
    corge: string;
  };
};

type MyFunction = (foo: number) => number;

type RecursivePartialOfBasic = RecursivePartial<Basic>;
describe("RecursivePartialOfBasic", () => {
  it("can be assigned various things", () => {
    expectTypeOf<RecursivePartialOfBasic>().toExtend<object>();
    expectTypeOf({}).toExtend<RecursivePartialOfBasic>();
    expectTypeOf({ bar: {} }).toExtend<RecursivePartialOfBasic>();
    expectTypeOf({
      bar: { corge: "" },
    }).toExtend<RecursivePartialOfBasic>();
    expectTypeOf({ bar: undefined }).toExtend<RecursivePartialOfBasic>();
    expectTypeOf(null).not.toMatchTypeOf<RecursivePartialOfBasic>();
    expectTypeOf(undefined).not.toMatchTypeOf<RecursivePartialOfBasic>();
    expectTypeOf({ bar: null }).not.toMatchTypeOf<RecursivePartialOfBasic>();
  });
});

type RecursivePartialOfMyFunction = RecursivePartial<MyFunction>;

describe("RecursivePartial on a function", () => {
  it("can be assigned {}", () => {
    expectTypeOf((x: number) => x).toExtend<RecursivePartialOfMyFunction>();
    expectTypeOf(null).not.toMatchTypeOf<RecursivePartialOfMyFunction>();
    expectTypeOf(undefined).not.toMatchTypeOf<RecursivePartialOfMyFunction>();
    expectTypeOf(() => null).not.toMatchTypeOf<RecursivePartialOfMyFunction>();
  });
});

// -----------------------------------------------------------------------------
// now to try and reverse the spell...
type RecursiveRequiredOfRecursivePartialOfBasic =
  RecursiveRequired<RecursivePartialOfBasic>;
describe("RecursiveRequiredOfRecursivePartialOfBasic", () => {
  expectTypeOf({
    bar: { corge: "" },
  }).toExtend<RecursiveRequiredOfRecursivePartialOfBasic>();
  expectTypeOf({}).not.toExtend<RecursiveRequiredOfRecursivePartialOfBasic>();
  expectTypeOf({
    bar: {},
  }).not.toExtend<RecursiveRequiredOfRecursivePartialOfBasic>();
  expectTypeOf({
    bar: null,
  }).not.toExtend<RecursiveRequiredOfRecursivePartialOfBasic>();
  expectTypeOf({
    bar: undefined,
  }).not.toExtend<RecursiveRequiredOfRecursivePartialOfBasic>();
});

// -----------------------------------------------------------------------------
// how about an array?
type RecursiveRequiredOfArrayOfRecursivePartialOfBasic = RecursiveRequired<
  RecursivePartial<Basic>[]
>;

describe("RecursiveRequiredOfArrayOfRecursivePartialOfBasic", () => {
  expectTypeOf(
    [],
  ).toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
  expectTypeOf([
    { bar: { corge: "" } },
  ]).toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
  expectTypeOf([
    { bar: {} },
  ]).not.toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
  expectTypeOf([
    { bar: null },
  ]).not.toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
  expectTypeOf([
    {},
  ]).not.toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
  expectTypeOf(
    undefined,
  ).not.toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
  expectTypeOf(
    null,
  ).not.toExtend<RecursiveRequiredOfArrayOfRecursivePartialOfBasic>();
});

// -----------------------------------------------------------------------------
// we can go deeper...
type RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic =
  RecursivePartial<RecursiveRequiredOfRecursivePartialOfBasic>;

describe("RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic", () => {
  expectTypeOf(
    {},
  ).toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
  expectTypeOf({
    bar: {},
  }).toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
  expectTypeOf({
    bar: { corge: "" },
  }).toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
  expectTypeOf({
    bar: undefined,
  }).toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
  expectTypeOf(
    null,
  ).not.toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
  expectTypeOf(
    undefined,
  ).not.toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
  expectTypeOf({
    bar: null,
  }).not.toExtend<RecursivePartialOfRecursiveRequiredOfRecursiveOfPartialOfBasic>();
});
