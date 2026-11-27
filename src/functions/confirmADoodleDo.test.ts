import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ DialogV2: vi.fn() }));

vi.mock("../fvtt-exports", () => ({ DialogV2: mocks.DialogV2 }));
vi.mock("./isGame", () => ({ assertGame: vi.fn() }));
vi.mock("./getTranslated", () => ({
  getTranslated: (text: string, values: Record<string, string> = {}) =>
    text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? ""),
}));

import { confirmADoodleDo } from "./confirmADoodleDo";

const render = vi.fn();

const getContent = () => {
  const container = document.createElement("div");
  container.innerHTML = mocks.DialogV2.mock.calls[0][0].content;
  return container;
};

describe("confirmADoodleDo", () => {
  it("puts the message in a paragraph as text, not as markup", () => {
    vi.stubGlobal("game", {});
    mocks.DialogV2.mockImplementation(() => ({ render }));
    void confirmADoodleDo({
      message: "Delete {Name}?",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      values: { Name: '<img src=x onerror="alert(1)">' },
    });

    const container = getContent();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe(
      'Delete <img src=x onerror="alert(1)">?',
    );
  });

  it("puts the bright confirm button first and keeps Cancel the default", () => {
    vi.stubGlobal("game", {});
    mocks.DialogV2.mockClear();
    mocks.DialogV2.mockImplementation(() => ({ render }));
    void confirmADoodleDo({
      message: "Delete it?",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
    });

    const buttons = mocks.DialogV2.mock.calls[0][0].buttons;
    expect(buttons).toMatchObject([
      { action: "confirm", label: "Delete", class: "bright" },
      { action: "cancel", label: "Cancel", default: true },
    ]);
    expect(buttons[0].default).toBeUndefined();
  });
});
