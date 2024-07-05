import React from "react";

type ButtonProps = React.PropsWithChildren<{
  onClick: () => void;
  className?: string;
}>;

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClick();
  };

  return (
    <button className={className} onClick={handleClick} css={{}}>
      {children}
    </button>
  );
};