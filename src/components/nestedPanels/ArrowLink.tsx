import { Link } from "@lumphammer/minirouter";
import type { ComponentProps } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";

import { cx } from "../../styled-system/css";
import { outcome } from "../../styled-system/recipes";

type ArrowLinkProps = ComponentProps<typeof Link> & {
  back?: boolean;
  danger?: boolean;
};

export const ArrowLink = ({
  back = false,
  danger = false,
  children,
  className,
  ...rest
}: ArrowLinkProps) => {
  return (
    <Link
      {...rest}
      className={cx(danger && outcome({ tone: "danger" }), className)}
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
