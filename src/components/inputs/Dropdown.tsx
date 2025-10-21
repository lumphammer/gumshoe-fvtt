import React, {
  CSSProperties,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { FaChevronDown } from "react-icons/fa";

import { systemLogger } from "../../functions/utilities";
import { useShowHideTransition } from "../transitions/useShowHideTransition";
import { Button } from "./Button";

export const DropdownContainerContext =
  React.createContext<RefObject<HTMLElement> | null>(null);

type Close = () => void;

export const CloseContext = React.createContext<Close>(() => {
  systemLogger.warn("CloseContext used without a provider");
});

type DropdownProps = {
  label?: any;
  showArrow?: boolean;
  style?: CSSProperties;
  className?: string;
  role?: string;
};

const duration = 200;

export const Dropdown = ({
  children,
  label,
  showArrow = true,
  style,
  role,
  className,
}: PropsWithChildren<DropdownProps>) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const bodyClick = useCallback(
    (event: MouseEvent) => {
      const targetIsRootElement = event.currentTarget === dropdownRef.current;
      const targetIsInsideRootElement =
        dropdownRef.current &&
        dropdownRef.current.contains(event.target as Node);
      const targetIsButtonElement = buttonRef.current?.contains(
        event.target as Node,
      );
      if (
        !(
          targetIsRootElement ||
          targetIsInsideRootElement ||
          targetIsButtonElement
        )
      ) {
        handleClose();
      }
    },
    [handleClose],
  );
  // we will always assume that the container
  // 1. is a parent of the current element
  // 2. has its own positioning context
  const container =
    useContext(DropdownContainerContext)?.current ?? document.body;

  const [[top, right], setPosition] = useState<[number, number]>([0, 0]);

  const handleClick = useCallback(() => {
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const top = (buttonRect?.bottom ?? 0) - containerRect.top;
    const right = containerRect.right - (buttonRect?.right ?? 0);
    setPosition([top, right]);

    setIsOpen((isOpen) => !isOpen);
  }, [container]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      const containerStyle = window.getComputedStyle(container);
      if (containerStyle.position === "static") {
        systemLogger.warn(
          "Dropdown container element has static positioning! " +
            "Your dropdowns may get positioned weirdly.",
        );
      }
    }
    container.addEventListener("click", bodyClick);
    return () => {
      container.removeEventListener("click", bodyClick);
    };
  }, [container, bodyClick]);

  const { shouldMount, isShowing } = useShowHideTransition(isOpen, duration);

  return (
    <>
      <Button
        role={role}
        ref={buttonRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        style={style}
        className={className}
        css={{
          cursor: "pointer",
        }}
      >
        {label}
        {showArrow ? (
          <FaChevronDown style={{ verticalAlign: "middle" }} />
        ) : null}
      </Button>

      {shouldMount &&
        ReactDOM.createPortal(
          <CloseContext.Provider value={handleClose}>
            <div
              style={{
                position: "absolute",
                top,
                right,
                transitionProperty: "opacity",
                transitionDuration: `${duration}ms`,
                zIndex: 10000,
                boxSizing: "border-box",
                opacity: isShowing ? 1 : 0,
              }}
              ref={dropdownRef}
            >
              {children}
            </div>
          </CloseContext.Provider>,
          container,
        )}
    </>
  );
};
