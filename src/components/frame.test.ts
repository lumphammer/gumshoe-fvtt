import { describe, expect, test } from "vitest";

import { claimFrame } from "./frame";

/** Claim a root's window and style it, as CSSReset does; returns release. */
function styleFrame(
  root: HTMLElement,
  slug: string,
  style: Record<string, string>,
  layout: "standard" | "full-frame" = "standard",
) {
  const claim = claimFrame(root);
  claim?.update(slug, style, layout);
  return claim && (() => claim.release());
}

/** A Foundry window with a themed root in its content. */
function makeWindow() {
  const frame = document.createElement("div");
  frame.className = "application";
  frame.innerHTML =
    '<header class="window-header"></header><section class="window-content"></section>';
  document.body.append(frame);
  const addRoot = (
    parent: Element = frame.querySelector(".window-content")!,
  ) => {
    const root = document.createElement("div");
    root.dataset["invTheme"] = "x";
    parent.append(root);
    return root;
  };
  return { frame, addRoot };
}

describe("styleFrame", () => {
  test("styles the window while its root is there", () => {
    const { frame, addRoot } = makeWindow();
    const cleanup = styleFrame(addRoot(), "a", { "--inv-text": "red" });
    expect(frame.dataset["invFrame"]).toBe("a");
    expect(frame.classList).toContain("inv-app-frame__root");
    expect(frame.querySelector(".window-header")!.classList).toContain(
      "inv-app-frame__header",
    );
    expect(frame.style.getPropertyValue("--inv-text")).toBe("red");
    cleanup!();
    expect(frame.dataset["invFrame"]).toBeUndefined();
    expect(frame.classList).not.toContain("inv-app-frame__root");
    expect(frame.style.getPropertyValue("--inv-text")).toBe("");
  });

  test("a root inside another leaves the frame alone", () => {
    const { addRoot } = makeWindow();
    const outer = addRoot();
    expect(styleFrame(addRoot(outer), "b", {})).toBeUndefined();
  });

  test("roots side by side take turns, and the earlier one gets it back", () => {
    const { frame, addRoot } = makeWindow();
    const sheet = styleFrame(addRoot(), "sheet", { "--inv-text": "red" });
    // a loading fallback, while the sheet is suspended
    const fallback = styleFrame(addRoot(), "fallback", {
      "--inv-line": "blue",
    });
    expect(frame.dataset["invFrame"]).toBe("fallback");
    expect(frame.style.getPropertyValue("--inv-text")).toBe("");
    fallback!();
    expect(frame.dataset["invFrame"]).toBe("sheet");
    expect(frame.classList).toContain("inv-app-frame__root");
    expect(frame.style.getPropertyValue("--inv-text")).toBe("red");
    expect(frame.style.getPropertyValue("--inv-line")).toBe("");
    sheet!();
    expect(frame.dataset["invFrame"]).toBeUndefined();
  });

  test("a root whose theme changes keeps its place", () => {
    const { frame, addRoot } = makeWindow();
    const first = claimFrame(addRoot())!;
    first.update("first", { "--inv-text": "red" }, "standard");
    const second = styleFrame(addRoot(), "second", {});
    first.update("changed", { "--inv-text": "green" }, "standard");
    expect(frame.dataset["invFrame"]).toBe("second");
    expect(frame.style.getPropertyValue("--inv-text")).toBe("");
    second!();
    expect(frame.dataset["invFrame"]).toBe("changed");
    expect(frame.style.getPropertyValue("--inv-text")).toBe("green");
  });

  test("an earlier root going first leaves the later one in charge", () => {
    const { frame, addRoot } = makeWindow();
    const first = styleFrame(addRoot(), "first", {});
    const second = styleFrame(addRoot(), "second", {});
    first!();
    expect(frame.dataset["invFrame"]).toBe("second");
    second!();
    expect(frame.classList).not.toContain("inv-app-frame__root");
  });
});

test("the full-frame layout is the latest owner's, and goes with it", () => {
  const { frame, addRoot } = makeWindow();
  const header = frame.querySelector(".window-header")!;
  const standard = styleFrame(addRoot(), "plain", {});
  const fullFrame = styleFrame(addRoot(), "fog", {}, "full-frame");
  expect(frame.dataset["invLayout"]).toBe("full-frame");
  expect(header.className).toContain(
    "inv-app-frame__header--layout_full-frame",
  );
  fullFrame!();
  expect(frame.dataset["invLayout"]).toBeUndefined();
  expect(header.className).not.toContain("layout_full-frame");
  expect(header.className).toContain("inv-app-frame__header--layout_standard");
  standard!();
  expect(header.className).toBe("window-header");
});
