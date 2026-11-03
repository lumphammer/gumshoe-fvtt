import { openSheet } from "../../functions/openSheet";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";

interface UnknownPageTypeEditorProps {
  page: any;
  /** the page's type, from its snapshot */
  type: string;
}

/**
 * Display for a  page type we don't handle (PDF or video, at the time of
 * writing.) Just displays a link to open Foundry's native editor.
 */
export const UnknownPageTypeEditor = ({
  page,
  type,
}: UnknownPageTypeEditorProps) => {
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
      <Button
        css={{ width: "auto" }}
        onClick={() => {
          openSheet(page);
        }}
      >
        Open {type} page
      </Button>
    </div>
  );
};

UnknownPageTypeEditor.displayName = "UnknownPageTypeEditor";
