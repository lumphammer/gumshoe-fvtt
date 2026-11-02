import { assertApplicationV2 } from "../../functions/assertApplicationV2";
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
  "use memo";

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
          const sheet = page.sheet;
          assertApplicationV2(sheet);
          void sheet.render({ force: true });
        }}
      >
        Open {type} page
      </Button>
    </div>
  );
};

UnknownPageTypeEditor.displayName = "UnknownPageTypeEditor";
