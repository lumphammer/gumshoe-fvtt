import { beforeEach, describe, expect, it, vi } from "vitest";

import { createParentStore } from "./documentStores";
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
