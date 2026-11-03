import { useItemSelector } from "../../hooks/useItemSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useSystemMethods } from "../../hooks/useSystemMethods";
import type { CardItem } from "../../module/items/card";
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

/** Editing a card: it reads the card and its categories through snapshots */
export const CardMain = ({ item }: { item: CardItem }) => {
  const view = useItemSelector(item, (snapshot) => ({
    name: snapshot.name,
    system: snapshot.system,
  }));
  const { system } = view;
  const methods = useSystemMethods(item);
  const categories = useSettings((s) => s.cardCategories);

  const categoryText = summarizeCategoryMemberships(
    system.cardCategoryMemberships,
    categories,
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
          <AsyncTextInput value={view.name} onChange={item.setName} />
        </GridField>
        <GridField label="Supertitle">
          <AsyncTextInput
            value={system.supertitle}
            onChange={methods.setSupertitle}
          />
        </GridField>
        <GridField label="Subtitle">
          <AsyncTextInput
            value={system.subtitle}
            onChange={methods.setSubtitle}
          />
        </GridField>

        <GridField label="Continuity">
          <Toggle
            checked={system.continuity}
            onChange={methods.setContinuity}
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
                    html={system.description}
                    className=""
                    onSave={methods.setDescription}
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
                    html={system.effects}
                    className=""
                    onSave={methods.setEffects}
                  />
                </InputGrid>
              ),
            },
          ]}
        />
      </div>
      <SlideInNestedPanelRoute direction={editCategoryMemberships}>
        <EditCategoryMemberships
          card={item}
          memberships={system.cardCategoryMemberships}
          styleKeyCategoryId={system.styleKeyCategoryId}
          categories={categories}
        />
      </SlideInNestedPanelRoute>
    </>
  );
};
