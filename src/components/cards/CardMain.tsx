import { useItemSheetContext } from "../../hooks/useSheetContexts";
import { assertCardItem } from "../../module/items/card";
import { absoluteCover } from "../absoluteCover";
import { AsyncTextInput } from "../inputs/AsyncTextInput";
import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { RichTextEditor } from "../inputs/RichTextEditor";
import { Toggle } from "../inputs/Toggle";
import { ArrowLink } from "../nestedPanels/ArrowLink";
import { SlideInNestedPanelRoute } from "../nestedPanels/SlideInNestedPanelRoute";
import { TabContainer } from "../TabContainer";
import { editCategoryMemberships } from "./directions";
import { EditCategoryMemberships } from "./EditCategoryMemberships";
import { summarizeCategoryMemberships } from "./functions";

export const CardMain = () => {
  const { item } = useItemSheetContext();
  assertCardItem(item);

  const categoryText = summarizeCategoryMemberships(
    item.system.cardCategoryMemberships,
  );

  return (
    <>
      <InputGrid>
        <GridField label="Categories">
          <ArrowLink to={editCategoryMemberships()}>
            {categoryText}
            {"  "}
          </ArrowLink>
        </GridField>
        <GridField label="Item Name">
          <AsyncTextInput value={item.name ?? ""} onChange={item.setName} />
        </GridField>
        <GridField label="Supertitle">
          <AsyncTextInput
            value={item.system.supertitle}
            onChange={item.system.setSupertitle}
          />
        </GridField>
        <GridField label="Subtitle">
          <AsyncTextInput
            value={item.system.subtitle}
            onChange={item.system.setSubtitle}
          />
        </GridField>

        <GridField label="Continuity">
          <Toggle
            checked={item.system.continuity}
            onChange={item.system.setContinuity}
          />
        </GridField>
      </InputGrid>
      <div
        className="notes-container"
        css={{
          flex: 1,
          position: "relative",
          marginTop: "0.5em",
        }}
      >
        <TabContainer
          defaultTab="description"
          tabs={[
            {
              id: "description",
              label: "Description",
              content: (
                <InputGrid
                  css={{
                    ...absoluteCover,
                    gridTemplateRows: "1fr",
                    margin: "0.5em",
                  }}
                >
                  <RichTextEditor
                    name="description"
                    html={item.system.description}
                    className=""
                    onSave={item.system.setDescription}
                  />
                </InputGrid>
              ),
            },
            {
              id: "effects",
              label: "Effects",
              content: (
                <InputGrid
                  css={{
                    ...absoluteCover,
                    gridTemplateRows: "1fr",
                    margin: "0.5em",
                  }}
                >
                  <RichTextEditor
                    name="effects"
                    html={item.system.effects}
                    className=""
                    onSave={item.system.setEffects}
                  />
                </InputGrid>
              ),
            },
          ]}
        />
      </div>
      <SlideInNestedPanelRoute direction={editCategoryMemberships}>
        <EditCategoryMemberships card={item} />
      </SlideInNestedPanelRoute>
    </>
  );
};
