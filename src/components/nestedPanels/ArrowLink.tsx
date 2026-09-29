import { Link } from "@lumphammer/minirouter";
import type { ComponentProps } from "react";
import { useContext } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

import { ThemeContext } from "../../themes/ThemeContext";

type ArrowLinkProps = ComponentProps<typeof Link> & {
  back?: boolean;
  danger?: boolean;
};

export const ArrowLink = ({
  back = false,
  danger = false,
  children,
  ...rest
}: ArrowLinkProps) => {
  const theme = useContext(ThemeContext);

  return (
    <Link
      {...rest}
      css={{
        "&&": {
          color: danger ? theme.colors.danger : undefined,
        },
      }}
    >
      {back && (
        <FaArrowLeft
          css={{
            marginRight: "0.3em",
            transform: "translateY(0.2em)",
          }}
        />
      )}
      <span
        css={{
          verticalAlign: "baseline",
        }}
      >
        {children}
      </span>
      {!back && (
        <FaArrowRight
          css={{
            marginLeft: "0.3em",
            transform: "translateY(0.2em)",
          }}
        />
      )}
    </Link>
  );
};

ArrowLink.displayName = "ArrowLink";
