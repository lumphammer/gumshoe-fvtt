import React, {
  useState,
  useCallback,
  CSSProperties,
  useContext,
  useRef,
  RefObject,
  useEffect,
  Fragment,
  PropsWithChildren,
} from "react";
import { FaChevronDown } from "react-icons/fa";
import ReactDOM from "react-dom";
import { FadeInOut } from "./FadeInOut";
import { DropdownBody } from "./DropdownBody";

export const DropdownContainerContext =
  React.createContext<RefObject<HTMLElement> | null>(null);

type Close = () => void;

export const CloseContext = React.createContext<Close>(() => {
  logger.warn("CloseContext used without a provider");
});

type DropdownProps = {
  label?: any;
  showArrow?: boolean;
  style?: CSSProperties;
  className?: string;
  role?: string;
};

export const Dropdown: React.FC<PropsWithChildren<DropdownProps>> = ({
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
  const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setIsOpen((isOpen) => !isOpen);
  }, []);

  // we will always assume that the container
  // 1. is a parent of the current element
  // 2. has its own positioning context
  const container =
    useContext(DropdownContainerContext)?.current ?? document.body;

  useEffect(() => {
    if (import.meta.env.MODE === "development") {
      const containerStyle = window.getComputedStyle(container);
      if (containerStyle.position === "static") {
        logger.warn(
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

  const buttonRect = buttonRef.current?.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const top = (buttonRect?.bottom ?? 0) - containerRect.top;
  const right = containerRect.right - (buttonRect?.right ?? 0);

  return (
    <Fragment>
      <button
        role={role}
        ref={buttonRef}
        onClick={handleClick}
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
      </button>

      {ReactDOM.createPortal(
        <FadeInOut>
          {isOpen && (
            <CloseContext.Provider value={handleClose}>
              <DropdownBody top={top} right={right} ref={dropdownRef}>
                {children}
              </DropdownBody>
            </CloseContext.Provider>
          )}
        </FadeInOut>,
        container,
      )}
    </Fragment>
  );
};
