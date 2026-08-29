import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  wait: vi.fn(),
  confirmADoodleDo: vi.fn(),
  isPersonalDetailItem: vi.fn(() => true),
  isActiveCharacterActor: vi.fn(() => true),
}));

vi.mock("../fvtt-exports", () => ({ DialogV2: { wait: mocks.wait } }));
vi.mock("../functions/isGame", () => ({ assertGame: vi.fn() }));
vi.mock("../functions/getTranslated", () => ({
  getTranslated: (message: string) => message,
}));
vi.mock("../functions/confirmADoodleDo", () => ({
  confirmADoodleDo: mocks.confirmADoodleDo,
}));
vi.mock("../module/items/personalDetail", () => ({
  isPersonalDetailItem: mocks.isPersonalDetailItem,
  personalDetailSchema: {},
}));
vi.mock("../module/actors/types", () => ({
  isActiveCharacterActor: mocks.isActiveCharacterActor,
}));
vi.mock("../settings/settings", () => ({
  settings: {
    occupationLabel: { get: () => "Occupation" },
    personalDetails: { get: () => [{ name: "Drive" }] },
  },
}));

import { installPersonalDetailHookHandler } from "./installPersonalDetailHookHandler";

type PreCreateItem = (
  item: any,
  createData: any,
  options: any,
  userId: string,
) => boolean | undefined;

const source = { type: "personalDetail", name: "Reckless" };

/**
 * Install the hook and return the handler it registered, along with the actor
 * whose slot 0 already contains one personal detail.
 */
function setUp() {
  let handler: PreCreateItem | undefined;
  vi.stubGlobal("Hooks", {
    on: (event: string, fn: PreCreateItem) => {
      if (event === "preCreateItem") handler = fn;
    },
  });
  vi.stubGlobal("game", { userId: "user1", packs: [] });
  const existing = { id: "existing1", system: { slotIndex: 0 } };
  const actor = {
    items: [existing],
    createEmbeddedDocuments: vi.fn((...args: any[]) => Promise.resolve([])),
    deleteEmbeddedDocuments: vi.fn((...args: any[]) => Promise.resolve([])),
  };
  actor.items.filter = Array.prototype.filter.bind(actor.items) as any;
  installPersonalDetailHookHandler();
  const item = { actor, toObject: () => source };
  const createData = {
    type: "personalDetail",
    name: "Reckless",
    system: { slotIndex: 0 },
  };
  return { handler: handler!, actor, item, createData, existing };
}

describe("installPersonalDetailHookHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPersonalDetailItem.mockReturnValue(true);
    mocks.isActiveCharacterActor.mockReturnValue(true);
  });

  it("cancels creation and does not create anything until the user answers", async () => {
    const { handler, actor, item, createData } = setUp();
    let answer!: (value: string | null) => void;
    mocks.wait.mockReturnValue(
      new Promise<string | null>((resolve) => {
        answer = resolve;
      }),
    );

    expect(handler(item, createData, {}, "user1")).toBe(false);
    await Promise.resolve();
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled();

    answer("add");
    await vi.waitFor(() =>
      expect(actor.createEmbeddedDocuments).toHaveBeenCalled(),
    );
  });

  it("treats a dismissed dialog the same as add", async () => {
    const { handler, actor, item, createData } = setUp();
    mocks.wait.mockResolvedValue(null);

    handler(item, createData, {}, "user1");

    await vi.waitFor(() =>
      expect(actor.createEmbeddedDocuments).toHaveBeenCalled(),
    );
    expect(actor.deleteEmbeddedDocuments).not.toHaveBeenCalled();
    expect(actor.createEmbeddedDocuments.mock.calls[0][1]).toEqual([source]);
  });

  it("deletes what is in the slot before creating when replacing", async () => {
    const { handler, actor, item, createData } = setUp();
    mocks.wait.mockResolvedValue("replace");

    handler(item, createData, {}, "user1");

    await vi.waitFor(() =>
      expect(actor.createEmbeddedDocuments).toHaveBeenCalled(),
    );
    expect(actor.deleteEmbeddedDocuments).toHaveBeenCalledWith("Item", [
      "existing1",
    ]);
    expect(
      actor.deleteEmbeddedDocuments.mock.invocationCallOrder[0],
    ).toBeLessThan(actor.createEmbeddedDocuments.mock.invocationCallOrder[0]);
  });

  it("lets an unconflicting creation through untouched", () => {
    const { handler, actor, item, createData } = setUp();
    createData.system.slotIndex = 1;

    expect(handler(item, createData, {}, "user1")).toBeUndefined();
    expect(mocks.wait).not.toHaveBeenCalled();
    expect(actor.createEmbeddedDocuments).not.toHaveBeenCalled();
  });

  it("lets its own re-issued creation through without asking again", () => {
    const { handler, item, createData } = setUp();

    expect(
      handler(
        item,
        createData,
        { investigatorPersonalDetailHandled: true },
        "user1",
      ),
    ).toBeUndefined();
    expect(mocks.wait).not.toHaveBeenCalled();
  });

  it("ignores creations made by another user", () => {
    const { handler, item, createData } = setUp();

    expect(handler(item, createData, {}, "user2")).toBeUndefined();
    expect(mocks.wait).not.toHaveBeenCalled();
  });
});
