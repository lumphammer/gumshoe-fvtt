import { expectTypeOf, it } from "vitest";

import { createParentStore } from "./documentStores";

type Entry = { name: string; pages: { _id: string; title: string }[] };
type Config = Parameters<typeof createParentStore<Entry, "pages">>[1];

it("checks own data, collection keys, serialized values and refreshes", () => {
  expectTypeOf<Config["ownData"]>().returns.toEqualTypeOf<{ name: string }>();
  expectTypeOf<keyof Config["collections"]>().toEqualTypeOf<"pages">();
  const config: Config = {
    ownData: () => ({ name: "Entry" }),
    updateHook: "updateJournalEntry",
    collections: {
      pages: {
        documentName: "JournalEntryPage",
        contents: () => [],
        // @ts-expect-error the snapshot requires a title
        toData: () => ({ _id: "a", name: "A" }),
      },
    },
    watchMore: (refresh) => {
      refresh("pages", "a", { _id: "a", title: "A" });
      // @ts-expect-error not an embedded collection
      refresh("name", "a", null);
      // @ts-expect-error wrong serialized data
      refresh("pages", "a", { _id: "a", name: "A" });
      return [];
    },
  };
  expectTypeOf(config).toEqualTypeOf<Config>();
});
