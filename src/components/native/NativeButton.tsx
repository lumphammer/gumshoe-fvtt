import type { ComponentProps } from "react";

type NativeButtonProps = Omit<ComponentProps<"button">, "onClick"> & {
  onClick: () => void;
};

/**
 * A button in the native world (chat cards, the combat tracker): Foundry's own
 * button, with none of the catalogue. See docs/theming.md.
 */
export const NativeButton = ({ onClick, ...rest }: NativeButtonProps) => (
  <button
    type="button"
    {...rest}
    onClick={(event) => {
      event.preventDefault();
      onClick();
    }}
  />
);
