import { beforeEach, expect, it, vi } from "vitest";

import { journalMemory, systemId } from "../../constants";
import { createDocumentMemory } from "./documentMemory/createDocumentMemory";
import { dehydrate } from "./documentMemory/dehydrate";
import { save } from "./documentMemory/save";
import { BareDocumentMemory } from "./documentMemory/types";
import { getMemoryId } from "./getMemoryId";
import { savePage } from "./savePage";

const { getLegacyMemories } = vi.hoisted(() => ({
  getLegacyMemories: vi.fn(() => ({})),
}));

vi.mock("../../settings/settings", () => ({
  settings: {
    journalMemories: {
      get: getLegacyMemories,
    },
  },
}));

type PageUpdate = {
  _id: string;
  text: { content: string };
  flags: Record<string, Record<string, BareDocumentMemory>>;
};

function createPage(id: string) {
  let storedMemory: BareDocumentMemory | undefined;
  const page = {
    id,
    getFlag: vi.fn(() => storedMemory),
    parent: {
      id: "journal-id",
      pack: null,
      updateEmbeddedDocuments: vi.fn((_type: string, updates: PageUpdate[]) => {
        storedMemory = updates[0].flags[systemId][journalMemory];
        return Promise.resolve();
      }),
    },
  };
  return {
    page,
    getStoredMemory: () => storedMemory,
  };
}

beforeEach(() => {
  getLegacyMemories.mockReset();
  getLegacyMemories.mockReturnValue({});
});

it("stores content and revision memory in one page update", async () => {
  const { page, getStoredMemory } = createPage("page-one");

  const memory = await savePage(page, "First version", undefined);

  expect(page.parent.updateEmbeddedDocuments).toHaveBeenCalledWith(
    "JournalEntryPage",
    [
      {
        _id: "page-one",
        text: { content: "First version" },
        flags: {
          [systemId]: {
            [journalMemory]: dehydrate(memory),
          },
        },
      },
    ],
  );
  expect(getStoredMemory()?.serial).toBe(1);
});

it("imports legacy world-setting history on the first page save", async () => {
  const { page, getStoredMemory } = createPage("legacy-page");
  const legacyMemory = save(createDocumentMemory(10), "Old version");
  getLegacyMemories.mockReturnValue({
    [getMemoryId(page)]: dehydrate(legacyMemory),
  });

  const memory = await savePage(page, "New version", undefined);

  expect(memory.serial).toBe(2);
  expect(memory.state).toBe("New version");
  expect(getStoredMemory()?.serial).toBe(2);
});

it("serializes overlapping saves to the same page", async () => {
  const { page } = createPage("queued-page");
  let releaseFirst: () => void = vi.fn();
  const firstCanFinish = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  page.parent.updateEmbeddedDocuments.mockImplementationOnce(
    async (_type: string, updates: PageUpdate[]) => {
      await firstCanFinish;
      const memory = updates[0].flags[systemId][journalMemory];
      page.getFlag.mockReturnValue(memory);
    },
  );

  const first = savePage(page, "First", undefined);
  await vi.waitFor(() =>
    expect(page.parent.updateEmbeddedDocuments).toHaveBeenCalledTimes(1),
  );
  const second = savePage(page, "Second", undefined);
  await Promise.resolve();
  expect(page.parent.updateEmbeddedDocuments).toHaveBeenCalledTimes(1);

  releaseFirst();
  const [firstMemory, secondMemory] = await Promise.all([first, second]);
  expect(firstMemory.serial).toBe(1);
  expect(secondMemory.serial).toBe(2);
  expect(secondMemory.state).toBe("Second");
});

it("does not block saves to different pages", async () => {
  const first = createPage("independent-one");
  const second = createPage("independent-two");
  let releaseFirst: () => void = vi.fn();
  const firstCanFinish = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  first.page.parent.updateEmbeddedDocuments.mockImplementationOnce(async () => {
    await firstCanFinish;
  });

  const firstSave = savePage(first.page, "First", undefined);
  await vi.waitFor(() =>
    expect(first.page.parent.updateEmbeddedDocuments).toHaveBeenCalledOnce(),
  );
  const secondSave = savePage(second.page, "Second", undefined);

  await expect(secondSave).resolves.toMatchObject({ state: "Second" });
  releaseFirst();
  await firstSave;
});

it("continues a page queue after a failed save", async () => {
  const { page } = createPage("failing-page");
  page.parent.updateEmbeddedDocuments.mockRejectedValueOnce(
    new Error("database unavailable"),
  );

  await expect(savePage(page, "Failed", undefined)).rejects.toThrow(
    "database unavailable",
  );
  await expect(savePage(page, "Recovered", undefined)).resolves.toMatchObject({
    state: "Recovered",
    serial: 1,
  });
});
