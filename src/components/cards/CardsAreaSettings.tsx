import { GridField } from "../inputs/GridField";
import { InputGrid } from "../inputs/InputGrid";
import { Select } from "../inputs/Select";
import { Translate } from "../Translate";
import type {
  CardsAreaSettings,
  CardsCategoryMode,
  CardsColumnWidth,
  CardsSortOrder,
  CardsViewMode,
} from "./types";

interface CardsAreaSettingsSheetProps {
  settings: CardsAreaSettings;
  onChangeSettings: (settings: Partial<CardsAreaSettings>) => void;
}

export const CardsAreaSettingsSheet = ({
  settings,
  onChangeSettings,
}: CardsAreaSettingsSheetProps) => {
  return (
    <InputGrid>
      <GridField label="Categories">
        <Select
          value={settings.category}
          onChange={(e) => {
            onChangeSettings({
              category: e.currentTarget.value as CardsCategoryMode,
            });
          }}
        >
          <option value="all">
            <Translate>Together</Translate>
          </option>
          <option value="categorized">
            <Translate>Separate</Translate>
          </option>
        </Select>
      </GridField>
      <GridField label="Sort order">
        <Select
          value={settings.sortOrder}
          onChange={(e) => {
            onChangeSettings({
              sortOrder: e.currentTarget.value as CardsSortOrder,
            });
          }}
        >
          <option value="newest">
            <Translate>Newest First</Translate>
          </option>
          <option value="oldest">
            <Translate>Oldest First</Translate>
          </option>
          <option value="atoz">
            <Translate>A — Z</Translate>
          </option>
          <option value="ztoa">
            <Translate>Z — A</Translate>
          </option>
        </Select>
      </GridField>
      <GridField label="View mode">
        <Select
          value={settings.viewMode}
          onChange={(e) => {
            onChangeSettings({
              viewMode: e.currentTarget.value as CardsViewMode,
            });
          }}
        >
          <option value="short">
            <Translate>Short</Translate>
          </option>
          <option value="full">
            <Translate>Full</Translate>
          </option>
        </Select>
      </GridField>
      <GridField label="Column width">
        <Select
          value={settings.columnWidth}
          onChange={(e) => {
            onChangeSettings({
              columnWidth: e.currentTarget.value as CardsColumnWidth,
            });
          }}
        >
          <option value="narrow">
            <Translate>Narrow</Translate>
          </option>
          <option value="wide">
            <Translate>Wide</Translate>
          </option>
          <option value="full">
            <Translate>Full</Translate> width
          </option>
        </Select>
      </GridField>
    </InputGrid>
  );
};

CardsAreaSettingsSheet.displayName = "CardsAreaSettingsSheet";
