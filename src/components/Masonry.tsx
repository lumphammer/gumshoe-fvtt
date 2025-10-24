import {
  PropsWithChildren,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

// adapted from https://github.com/mui/material-ui/blob/next/packages/mui-lab/src/Masonry/Masonry.js

const helperDataToken = "masonryHelper";
const helperDataProps = {
  "data-masonry-helper": true,
};

/**
 * Parse a string like "100px" to a number
 */
const parsePxToNumber = (pxString: string): number =>
  // no checking the source string here because we're only using this for
  // values that are coming from `getComputedStyle`
  Number(pxString.replace("px", ""));

/**
 * We only want to measure and position HTML elements that we didn't add
 * ourselves.
 */
const isValidElement = (node: Node): node is HTMLElement => {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  const isHelper = Boolean(node.dataset[helperDataToken]);
  return isHelper === false;
};

type MasonryProps = PropsWithChildren<{
  /**
   * The minimum width of a column. Any valid CSS length value. To achieve a
   * fixed column count, specify this as a percentage, e.g. 33.33% for three
   * columns.
   */
  minColumnWidth: string;
  /** The gap between columns. Any valid CSS length value. */
  columnGap?: string;
  className?: string;
}>;

/**
 * A simple masonry layout component. It will layout children in columns,
 * starting from the top left and adding children to the shortest column.
 *
 * Uses flexbox with wrapping and a fixed height to flow the layout.
 */
export const Masonry = function Masonry({
  children,
  minColumnWidth,
  columnGap = "0px",
  className,
}: MasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measurerRef = useRef<HTMLDivElement>(null);
  const [maxColumnHeight, setMaxColumnHeight] = useState(0);
  const [numColumns, setNumColumns] = useState(1);

  // ///////////////////////////////////////////////////////////////////////////
  // compare the measurer to the container to work out how many columns we can
  // fit in.
  const handleCalculateNumColumns = useCallback(() => {
    if (!measurerRef.current || !containerRef.current) {
      return;
    }
    const containerWidth = containerRef.current.clientWidth;
    const measurerWidth = measurerRef.current.clientWidth;
    const numColumns = Math.max(1, Math.floor(containerWidth / measurerWidth));
    setNumColumns(numColumns);
  }, []);

  // run handleCalculateNumColumns when the container or the measurer changes
  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      handleCalculateNumColumns();
    });
    resizeObserver.observe(containerRef.current!);
    resizeObserver.observe(measurerRef.current!);
    return () => {
      resizeObserver.disconnect();
    };
  }, [handleCalculateNumColumns]);

  // ///////////////////////////////////////////////////////////////////////////
  // handle resize - the core of the masonry engine
  const handleResize = useCallback(() => {
    if (
      !containerRef.current ||
      containerRef.current.clientWidth === 0 ||
      numColumns === 0
    ) {
      return;
    }

    const columnHeights = Array.from({ length: numColumns }, () => 0);

    // iterate through children
    containerRef.current.childNodes.forEach((child: Node) => {
      // skip non-elements and linebreaks
      if (!isValidElement(child)) {
        return;
      }
      const computedStyle = getComputedStyle(child);
      const childHeight =
        Math.ceil(parsePxToNumber(computedStyle.height)) +
        parsePxToNumber(computedStyle.marginTop) +
        parsePxToNumber(computedStyle.marginBottom);

      // find the current shortest column (where the current item will be placed)
      const currentMinColumnIndex = columnHeights.indexOf(
        Math.min(...columnHeights),
      );
      columnHeights[currentMinColumnIndex] += childHeight;

      // update child styles
      child.style.order = `${currentMinColumnIndex + 1}`;
      child.style.flexShrink = "0";
      child.style.marginRight =
        currentMinColumnIndex === numColumns - 1 ? "0px" : columnGap;
    });
    // wrap this in flushSync so the container get resized immediately - without
    // this there will be a flash of the wrong size
    flushSync(() => {
      setMaxColumnHeight(Math.max(...columnHeights));
    });
  }, [columnGap, numColumns]);

  // call handleResize when any children resize
  useLayoutEffect(() => {
    // let animationFrame: number;

    const resizeObserver = new ResizeObserver((entries) => {
      // mui wraps this in a requestAnimationFrame
      // see https://github.com/mui/material-ui/issues/36909
      // animationFrame = requestAnimationFrame(handleResize);
      handleResize();
    });

    if (containerRef.current) {
      containerRef.current.childNodes.forEach((childNode: ChildNode) => {
        resizeObserver.observe(childNode as Element);
      });
    }

    return () => {
      // see above
      // if (animationFrame) {
      //   window.cancelAnimationFrame(animationFrame);
      // }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
    // depends on children even though they're not mentioned by name
  }, [handleResize, children]);

  // ///////////////////////////////////////////////////////////////////////////
  // knit some values we'll need for the render

  // the base width of a column: 100% / the number of columns
  const baseColumnWidth = numColumns === 0 ? "100%" : `${100 / numColumns}%`;

  // we adjust column width in a css calc based on the column gap * this factor
  // e.g. in a 3-column grid we subtract columnGap * ( 2/3 ) from the width
  // in a 4-column grid we subtract columnGap * ( 3/4 ) from the width
  // ... because there's no gap after the last column
  const columnGapSizingFactor =
    numColumns === 0 ? 0 : (numColumns - 1) / numColumns;

  // the final css expression for the width of each column
  const widthExpression = `calc(${baseColumnWidth} - (${columnGap} * ${columnGapSizingFactor}))`;

  // linebreak divs force the flex-wrap to start a new column
  const lineBreaks = Array.from({ length: numColumns - 1 }, (_, index) => (
    <span
      key={index}
      {...helperDataProps}
      // using style not css to ensure we override css from the container
      style={{
        flexBasis: "100%",
        width: "0px",
        margin: "0px",
        padding: "0px",
        order: index + 1,
      }}
    />
  ));

  // and render...
  return (
    <div
      ref={containerRef}
      className={className}
      css={{
        display: "flex",
        flexFlow: "column wrap",
        height: maxColumnHeight === 0 ? "auto" : maxColumnHeight + "px",
        alignContent: "flex-start",
        position: "relative",
        "> *": {
          width: widthExpression,
        },
      }}
    >
      <div
        {...helperDataProps}
        ref={measurerRef}
        // using style not css to ensure we override css from the container
        style={{
          width: minColumnWidth,
          visibility: "hidden",
          position: "absolute",
        }}
      />
      {children}
      {lineBreaks}
    </div>
  );
};
