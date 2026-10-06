import { beforeEach, describe, expect, it, vi } from "vitest";

import { installChatLogScrollKeeper } from "./installChatLogScrollKeeper";

const clientHeight = 500;
const scrollHeight = 10000;
const maxScrollTop = scrollHeight - clientHeight;

function setUp(initialScrollTop = maxScrollTop) {
  let renderChatLog: any;
  vi.stubGlobal("Hooks", {
    on: (event: string, fn: unknown) => {
      if (event === "renderChatLog") renderChatLog = fn;
    },
  });
  const resizeCallbacks: Array<() => void> = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resizeCallbacks.push(callback);
      }
      observe = vi.fn();
    },
  );

  const element = document.createElement("section");
  element.innerHTML = `<div class="chat-scroll"><ol class="chat-log"></ol></div>`;
  const scroll = element.querySelector(".chat-scroll")!;
  let scrollTop = initialScrollTop;
  Object.defineProperties(scroll, {
    scrollHeight: { get: () => scrollHeight },
    clientHeight: { get: () => clientHeight },
    scrollTop: {
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    },
  });

  const app = { rendered: true, scrollBottom: vi.fn() };
  installChatLogScrollKeeper();
  renderChatLog(app, element);

  const scrollTo = (value: number) => {
    scroll.scrollTop = value;
    scroll.dispatchEvent(new Event("scroll"));
  };
  const resize = () => resizeCallbacks.forEach((callback) => callback());
  return { app, resize, scrollTo };
}

describe("installChatLogScrollKeeper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the log pinned when it was at the bottom", () => {
    const { app, resize, scrollTo } = setUp(0);
    scrollTo(maxScrollTop);

    resize();

    expect(app.scrollBottom).toHaveBeenCalledTimes(1);
  });

  it("allows for fractional scroll positions at the bottom", () => {
    const { app, resize, scrollTo } = setUp(0);
    scrollTo(maxScrollTop - 2);

    resize();

    expect(app.scrollBottom).toHaveBeenCalledTimes(1);
  });

  // Foundry's `isAtBottom` would count this as the bottom (it's within 1% of
  // the scroll range), which is what made the log jump
  it("leaves the log alone when it was a little way above the bottom", () => {
    const { app, resize, scrollTo } = setUp();
    scrollTo(maxScrollTop - 3);

    resize();

    expect(app.scrollBottom).not.toHaveBeenCalled();
  });

  it("pins the log again once it's scrolled back to the bottom", () => {
    const { app, resize, scrollTo } = setUp();
    scrollTo(maxScrollTop - 300);
    scrollTo(maxScrollTop);

    resize();

    expect(app.scrollBottom).toHaveBeenCalledTimes(1);
  });

  it("leaves the log alone if it was scrolled up when the keeper attached", () => {
    const { app, resize } = setUp(maxScrollTop - 300);

    resize();

    expect(app.scrollBottom).not.toHaveBeenCalled();
  });

  it("doesn't scroll the log while it isn't rendered", () => {
    const { app, resize } = setUp();
    app.rendered = false;

    resize();

    expect(app.scrollBottom).not.toHaveBeenCalled();
  });
});
