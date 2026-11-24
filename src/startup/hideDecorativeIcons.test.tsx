import { render } from "@testing-library/react";
import { FaCheck } from "react-icons/fa";
import { expect, it } from "vitest";

import { hideDecorativeIcons } from "./hideDecorativeIcons";

it("hides icons from screen readers, unless one asks otherwise", () => {
  hideDecorativeIcons();
  const { container } = render(
    <>
      <FaCheck data-testid="plain" />
      <FaCheck data-testid="named" aria-hidden={false} aria-label="Yes" />
    </>,
  );
  const plain = container.querySelector("[data-testid=plain]")!;
  const named = container.querySelector("[data-testid=named]")!;
  expect(plain.getAttribute("aria-hidden")).toBe("true");
  expect(named.getAttribute("aria-hidden")).toBe("false");
  expect(named.getAttribute("aria-label")).toBe("Yes");
});
