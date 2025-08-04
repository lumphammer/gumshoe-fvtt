import React, { useCallback, useContext, useState } from "react";

import { getTokenizer } from "../functions/getTokenizer";
import { assertGame } from "../functions/isGame";
import { FilePicker, ImagePopout } from "../fvtt-exports";
import { useIsDocumentOwner } from "../hooks/useIsDocumentOwner";
import { useDocumentSheetContext } from "../hooks/useSheetContexts";
import { ThemeContext } from "../themes/ThemeContext";
import { ImagePickerLink } from "./ImagePickerLink";

const cover = {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
} as const;

const transitionTime = "0.3s";

type ImagePickleProps = {
  className?: string;
};

export const ImagePickle = ({ className }: ImagePickleProps) => {
  const { doc, app } = useDocumentSheetContext();
  if (!(doc instanceof Actor || doc instanceof Item)) {
    throw new Error("ImagePickle must be used within an Actor or Item");
  }
  const [showOverlay, setShowOverlay] = useState(false);
  const theme = useContext(ThemeContext);
  assertGame(game);
  const isOwner = useIsDocumentOwner();

  const onClickEdit = useCallback(() => {
    setShowOverlay(false);
    assertGame(game);
    const { tokenizerIsActive, tokenizerApi } = getTokenizer();
    const subjectIsActor = doc instanceof Actor;
    // if tokenizer is available and the subject is an actor, use tokenizer
    // see https://github.com/n3dst4/gumshoe-fvtt/issues/706
    if (tokenizerIsActive && tokenizerApi !== undefined && subjectIsActor) {
      tokenizerApi.tokenizeActor(doc);
    } else {
      const fp = new FilePicker.implementation({
        type: "image",
        current: doc.img ?? undefined,
        callback: (path: string) => {
          void doc.update({
            img: path,
          });
        },
        position: {
          top: (app.position.top ?? 0) + 40,
          left: (app.position.left ?? 0) + 10,
        },
        window: {},
      });
      return fp.browse(doc.img ?? "");
    }
  }, [app.position.left, app.position.top, doc]);

  const showImage = useCallback(() => {
    const ip = new ImagePopout({
      window: {
        title: doc.img ?? "",
      },
      src: doc.img ?? "",
    });
    void ip.render({ force: true });
  }, [doc.img]);

  const onClickShow = useCallback(() => {
    setShowOverlay(false);
    showImage();
  }, [showImage]);

  const onClickImage = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation();
      if (isOwner) {
        setShowOverlay(true);
        const clickListener = () => {
          setShowOverlay(false);
        };
        document.addEventListener("click", clickListener);

        return () => {
          document.removeEventListener("click", clickListener);
        };
      } else {
        showImage();
      }
    },
    [isOwner, showImage],
  );

  return (
    <div
      className={className}
      css={{
        borderRadius: "0.2em",
        boxShadow: "0em 0em 0.5em 0.1em rgba(0,0,0,0.5)",
        position: "relative",
      }}
      onClick={(e) => onClickImage(e)}
    >
      <div
        css={{
          ...cover,
          overflow: "hidden",
        }}
      >
        <div
          css={{
            ...cover,
            backgroundImage: `url("${doc.img}")`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: showOverlay ? "blur(0.7em)" : undefined,
            transition: `filter ${transitionTime} ease-in`,
          }}
        />
      </div>

      <div
        css={{
          ...cover,
          opacity: showOverlay ? 1 : 0,
          transition: `opacity ${transitionTime} ease-in`,
          background: theme.colors.backgroundSecondary,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {showOverlay && (
          <>
            <ImagePickerLink onClick={onClickShow}>Show</ImagePickerLink>
            <ImagePickerLink onClick={onClickEdit}>Edit</ImagePickerLink>
          </>
        )}
      </div>
    </div>
  );
};
