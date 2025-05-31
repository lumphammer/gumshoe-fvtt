import { assertApplicationV2 } from "../../functions/utilities";
import { absoluteCover } from "../absoluteCover";
import { Button } from "../inputs/Button";

interface UnknownPageTypeEditorProps {
  page: any;
}

/**
 * Display for a  page type we don't handle (PDF or video, at the time of
 * writing.) Just displays a link to open Foundry's native editor.
 */
export const UnknownPageTypeEditor = ({ page }: UnknownPageTypeEditorProps) => {
  const sheet = page.sheet;
  assertApplicationV2(sheet);

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
        onClick={() => sheet.render({ force: true })}
      >
        Open {page.type} page
      </Button>
    </div>
  );
};

UnknownPageTypeEditor.displayName = "UnknownPageTypeEditor";
