import { useCallback } from "react";

import { absoluteCover } from "../absoluteCover";
import { AsyncTextArea } from "../inputs/AsyncTextArea";
import { GridFieldStacked } from "../inputs/GridFieldStacked";
import { InputGrid } from "../inputs/InputGrid";
import { ImageArea } from "./ImageArea";

interface ImageEditorProps {
  page: any;
}

/**
 * A basic image page. Delegates to Foundry's native editor to do the heavy
 * lifting.
 */
export const ImageEditor = ({ page }: ImageEditorProps) => {
  const handleChange = useCallback(
    async (value: string) => {
      await page.update({ image: { caption: value } });
    },
    [page],
  );

  return (
    <div
      css={{
        ...absoluteCover,
        display: "grid",
        gridTemplateColumns: "1fr 1fr ",
        gridTemplateRows: "1fr",
      }}
    >
      <ImageArea page={page} />
      <InputGrid css={{ padding: "0.5em", gridTemplateRows: "1fr 1fr" }}>
        <GridFieldStacked label="Caption" noTranslate>
          <AsyncTextArea
            value={page.image.caption}
            onChange={handleChange}
            css={{ flex: 1 }}
          />
        </GridFieldStacked>
      </InputGrid>
    </div>
  );
};

ImageEditor.displayName = "ImageEditor";
