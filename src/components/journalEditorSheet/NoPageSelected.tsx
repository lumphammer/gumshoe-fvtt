import { FaArrowLeft } from "react-icons/fa6";

import { absoluteCover } from "../absoluteCover";

/**
 * Content to display when no page is selected
 */
export const NoPageSelected = () => {
  return (
    <div
      css={{
        ...absoluteCover,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "1.5em",
        // color: "gray",
      }}
    >
      <FaArrowLeft />
      &nbsp; Select a page to edit
    </div>
  );
};

NoPageSelected.displayName = "NoPageSelected";
