import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { TextInput } from "./TextInput";

const user = userEvent.setup();

it("should should show input value", () => {
  const { getByRole } = render(
    <TextInput value={"foobar"} onChange={vi.fn()} />,
  );

  expect(getByRole("textbox").getAttribute("value")).toBe("foobar");
});

it("should trigger the callback when the value changes", async () => {
  const onChange = vi.fn();
  const { getByRole } = render(<TextInput onChange={onChange} />);
  const input = getByRole("textbox");

  input.focus();
  await user.keyboard("foo");
  expect(onChange).toHaveBeenCalledTimes(3);
  expect(onChange).toHaveBeenCalledWith("foo");
});
