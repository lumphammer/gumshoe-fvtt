import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ ImagePopout: vi.fn(), render: vi.fn() }));

vi.mock("../fvtt-exports", () => ({ ImagePopout: mocks.ImagePopout }));

import { popOutClickedImage } from "./popOutClickedImage";

const click = (html: string, selector: string) => {
  const container = document.createElement("div");
  container.innerHTML = html;
  popOutClickedImage({ target: container.querySelector(selector) });
};

describe("popOutClickedImage", () => {
  beforeEach(() => {
    mocks.ImagePopout.mockReset();
    mocks.render.mockReset();
    mocks.ImagePopout.mockImplementation(() => ({ render: mocks.render }));
  });

  it("pops out a clicked image, titled from its title or alt", () => {
    click('<p><img src="a.webp" alt="Agent Smith"></p>', "img");
    expect(mocks.ImagePopout).toHaveBeenCalledWith({
      src: "a.webp",
      window: { title: "Agent Smith" },
    });
    expect(mocks.render).toHaveBeenCalledWith({ force: true });
  });

  it("prefers the title to the alt text", () => {
    click('<img src="a.webp" alt="alt" title="title">', "img");
    expect(mocks.ImagePopout.mock.calls[0][0].window.title).toBe("title");
  });

  it("ignores clicks on anything else", () => {
    click('<p><img src="a.webp">text</p>', "p");
    expect(mocks.ImagePopout).not.toHaveBeenCalled();
  });

  it("ignores images marked nopopout", () => {
    click('<img class="nopopout" src="a.webp">', "img");
    expect(mocks.ImagePopout).not.toHaveBeenCalled();
  });

  it("ignores images being edited", () => {
    click('<div contenteditable="true"><img src="a.webp"></div>', "img");
    expect(mocks.ImagePopout).not.toHaveBeenCalled();
  });

  it("ignores images with no src", () => {
    click("<img>", "img");
    expect(mocks.ImagePopout).not.toHaveBeenCalled();
  });
});
