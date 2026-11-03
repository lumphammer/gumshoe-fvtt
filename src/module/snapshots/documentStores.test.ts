import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createParentStore,
  getActorStore,
  getCombatantResourceStore,
  getCombatStore,
} from "./documentStores";
import { stubHooks } from "./stubHooks";

type Page = { id: string; parent: unknown; name: string };

/** A parent document with some pages, and a store of it */
function setUp() {
  const { call } = stubHooks();
  const parent = { name: "Entry", pages: [] as Page[] };
  const addPage = (id: string, name: string) => {
    const page = { id, parent, name };
    parent.pages.push(page);
    return page;
  };
  addPage("a", "A");
  addPage("b", "B");
  const store = createParentStore<{
    name: string;
    pages: { _id: string; name: string }[];
  }>(parent, {
    ownData: () => ({ name: parent.name }),
    updateHook: "updateJournalEntry",
    collections: {
      pages: {
        documentName: "JournalEntryPage",
        contents: () => parent.pages,
        toData: (page: Page) => ({ _id: page.id, name: page.name }),
      },
    },
  });
  const listener = vi.fn();
  store.subscribe(listener);
  return { call, parent, addPage, store, listener };
}

describe("createParentStore", () => {
  let t: ReturnType<typeof setUp>;
  beforeEach(() => {
    t = setUp();
  });

  it("holds the parent's own data and its embedded documents", () => {
    expect(t.store.getSnapshot()).toEqual({
      name: "Entry",
      pages: [
        { _id: "a", name: "A" },
        { _id: "b", name: "B" },
      ],
    });
  });

  it("copies only the embedded document that changed", () => {
    const before = t.store.getSnapshot();
    t.parent.pages[1].name = "B2";
    t.call("updateJournalEntryPage", t.parent.pages[1]);
    const after = t.store.getSnapshot();
    expect(after.pages[1]).toEqual({ _id: "b", name: "B2" });
    expect(after.pages[0]).toBe(before.pages[0]);
    expect(t.listener).toHaveBeenCalledTimes(1);
  });

  it("adds and removes embedded documents", () => {
    const page = t.addPage("c", "C");
    t.call("createJournalEntryPage", page);
    expect(t.store.getSnapshot().pages.map((p) => p._id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    t.parent.pages.splice(0, 1);
    t.call("deleteJournalEntryPage", { id: "a", parent: t.parent });
    expect(t.store.getSnapshot().pages.map((p) => p._id)).toEqual(["b", "c"]);
  });

  it("follows changes to the parent itself", () => {
    t.parent.name = "Renamed";
    t.call("updateJournalEntry", t.parent);
    expect(t.store.getSnapshot().name).toBe("Renamed");
  });

  it("ignores other documents", () => {
    const before = t.store.getSnapshot();
    t.call("updateJournalEntry", { name: "Other" });
    t.call("updateJournalEntryPage", { id: "a", parent: {}, name: "X" });
    expect(t.store.getSnapshot()).toBe(before);
    expect(t.listener).not.toHaveBeenCalled();
  });
});

/** A fake combat with two combatants, and a store of it */
function setUpCombat() {
  const { call } = stubHooks();
  vi.stubGlobal("foundry", { utils: { deepClone: structuredClone } });
  const tokenA = { name: "Token A" };
  const combat = {
    _source: { round: 1, turn: 0, combatants: [] },
    combatants: [] as unknown[],
    turns: [] as { id: string }[],
  };
  const combatant = (id: string, initiative: number, token: unknown) => {
    const fake = {
      id,
      parent: combat,
      token,
      actor: null,
      img: null,
      get name() {
        return (token as { name: string } | null)?.name ?? id;
      },
      initiative,
      toObject: () => ({
        _id: id,
        type: "classic",
        system: { initiative: fake.initiative },
      }),
    };
    return fake;
  };
  const combatantList = [combatant("a", 3, tokenA), combatant("b", 5, null)];
  combat.combatants = Object.assign([...combatantList], {
    contents: combatantList,
  });
  // highest initiative first, as Foundry's turn order would have it
  const sortTurns = () => {
    combat.turns = combatantList
      .toSorted((x, y) => y.initiative - x.initiative)
      .map(({ id }) => ({ id }));
  };
  sortTurns();
  const store = getCombatStore(combat as unknown as Combat.Implementation);
  const listener = vi.fn();
  store.subscribe(listener);
  return { call, combat, combatantList, sortTurns, store, tokenA, listener };
}

describe("getCombatStore", () => {
  it("holds the combatants and the turn order", () => {
    const { store } = setUpCombat();
    expect(store.getSnapshot().turnIds).toEqual(["b", "a"]);
    expect(store.getSnapshot().combatants.map((c) => c.name)).toEqual([
      "Token A",
      "b",
    ]);
  });

  it("reads the turn order again when a combatant changes", () => {
    const { call, combatantList, sortTurns, store } = setUpCombat();
    const before = store.getSnapshot();
    combatantList[0].initiative = 9;
    sortTurns();
    call("updateCombatant", combatantList[0]);
    const after = store.getSnapshot();
    expect(after.turnIds).toEqual(["a", "b"]);
    // the other combatant keeps its identity
    expect(after.combatants[1]).toBe(before.combatants[1]);
    expect(after.combatants[0]).not.toBe(before.combatants[0]);
  });

  it("follows a combatant's token being renamed", () => {
    const { call, store, tokenA, listener } = setUpCombat();
    tokenA.name = "Renamed";
    call("updateToken", tokenA);
    expect(store.getSnapshot().combatants[0].name).toBe("Renamed");
    expect(listener).toHaveBeenCalledTimes(1);
    call("updateToken", { name: "Someone else" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("getCombatantResourceStore", () => {
  /** A fake combatant, which calls its handlers when its resource changes */
  function setUpCombatant(resource: unknown) {
    const handlers = new Set<() => void>();
    const combatant = {
      resource,
      registerResourceHandler: (handler: () => void) => {
        handlers.add(handler);
        // as `InvestigatorCombatant` does: straight away, then on changes
        handler();
        return () => handlers.delete(handler);
      },
      setResource: (value: unknown) => {
        combatant.resource = value;
        handlers.forEach((handler) => handler());
      },
    };
    return combatant;
  }

  it("reads the resource as a number", () => {
    expect(getCombatantResourceStore(setUpCombatant(4)).getSnapshot()).toBe(4);
    expect(
      getCombatantResourceStore(
        setUpCombatant({ value: 7, max: 9 }),
      ).getSnapshot(),
    ).toBe(7);
    expect(getCombatantResourceStore(setUpCombatant(null)).getSnapshot()).toBe(
      0,
    );
  });

  it("notifies only when the value changes", () => {
    const combatant = setUpCombatant({ value: 2 });
    const store = getCombatantResourceStore(combatant);
    const listener = vi.fn();
    // the handler is called on subscribing, with the same value
    store.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
    combatant.setResource({ value: 2 });
    expect(listener).not.toHaveBeenCalled();
    combatant.setResource({ value: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(1);
  });
});

describe("getActorStore", () => {
  it("refreshes an item for its own effect only once the actor is prepared", async () => {
    const { call } = stubHooks();
    class FakeItem {
      constructor(
        public id: string,
        public parent: unknown,
        public effects: string[],
      ) {}
      toObject() {
        return { _id: this.id, type: "equipment", effects: [...this.effects] };
      }
    }
    vi.stubGlobal("Item", FakeItem);
    vi.stubGlobal("foundry", { utils: { deepClone: structuredClone } });
    let applied = 0;
    const actor = {
      _source: { name: "Agent", items: [], effects: [], system: {} },
      // what's derived from the items: here, how many effects they apply
      system: { toObject: () => ({ applied: applied }) },
      items: { contents: [] as FakeItem[] },
      effects: { contents: [] },
      isToken: false,
    };
    const item = new FakeItem("i", actor, []);
    actor.items.contents.push(item);
    const store = getActorStore(actor as unknown as Actor.Implementation);
    store.subscribe(vi.fn());

    // the item has its new effect, but the actor isn't prepared again yet
    item.effects.push("e");
    call("createActiveEffect", { id: "e", parent: item });
    // Foundry prepares the actor again as it dispatches the change
    applied = 1;
    expect(store.getSnapshot().items[0].effects).toEqual([]);
    await Promise.resolve();
    expect(store.getSnapshot().items[0].effects).toEqual(["e"]);
    expect(store.getSnapshot().system).toEqual({ applied: 1 });
  });
});
