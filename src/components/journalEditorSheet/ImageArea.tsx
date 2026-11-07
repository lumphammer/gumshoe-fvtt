import { useCallback } from "react";

import { FilePicker } from "../../fvtt-exports";
import { useJournalEntrySnapshot } from "../../hooks/useJournalEntrySnapshot";
import { useDocumentSheetContext } from "../../hooks/useSheetContexts";
import { absoluteCover } from "../absoluteCover";
import Cross from "./no_image_cross.svg?react";
import { floating, row } from "../../styled-system/recipes";

interface ImageAreaProps {
  page: any;
}

/**
 * A basic image page. Delegates to Foundry's native editor to do the heavy
 * lifting.
 */
export const ImageArea = ({ page }: ImageAreaProps) => {
  const { app } = useDocumentSheetContext();
  const src = useJournalEntrySnapshot(
    page.parent,
    (entry) => entry.pages.find((p) => p._id === page.id)?.src ?? null,
  );

  const handleClickImage = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const fp = new FilePicker({
        type: "image",
        current: src ?? undefined,
        callback: (path: string) => {
          void page.update({
            src: path,
          });
        },
        position: {
          top: (app.position.top ?? 0) + 40,
          left: (app.position.left ?? 0) + 10,
        },
      });
      return fp.browse(src ?? "");
    },
    [app.position.left, app.position.top, page, src],
  );

  return (
    <div
      data-testid="image-container"
      css={{
        position: "relative",
        textAlign: "center",
      }}
    >
      <a
        css={{
          margin: "auto",
          ...absoluteCover,
        }}
        onClick={handleClickImage}
      >
        {src ? (
          <img
            css={{
              cursor: "pointer",
              ":hover": {
                opacity: 0.5,
              },
              maxWidth: "100%",
              maxHeight: "100%",
            }}
            src={src}
          />
        ) : (
          <div
            className={row({ interactive: true })}
            css={{
              ...absoluteCover,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              className={floating({ kind: "chip" })}
              css={{ fontSize: "1.5em", padding: "1em" }}
            >
              Click to add image
            </div>
            {/* It would be nice to set
              vectorEffect="non-scaling-stroke" or put
              vectorEffect: "non-scaling-stroke" in the css but neither work,
              probably because we're in the SVGO options (in the VIte config)
              we're converting CSS to attributes to allow us to change the color
              to currentColor.
            */}
            <Cross
              preserveAspectRatio="none"
              style={{
                color: "#0003",
                position: "absolute",
                top: "0%",
                left: "0%",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        )}
      </a>
    </div>
  );
};

ImageArea.displayName = "ImageArea";
