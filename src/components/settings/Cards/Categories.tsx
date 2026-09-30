import { Link, useNavigationContext } from "@lumphammer/minirouter";
import { nanoid } from "nanoid";
import { useCallback, useContext, useMemo } from "react";

import { irid } from "../../../irid/irid";
import { ThemeContext } from "../../../themes/ThemeContext";
import { absoluteCover } from "../../absoluteCover";
import { Button } from "../../inputs/Button";
import { SortableTable } from "../../sortableTable";
import { Translate } from "../../Translate";
import { DispatchContext, StateContext } from "../contexts";
import { store } from "../store";
import { cardCategory } from "./directions";

export const Categories = () => {
  const { settings } = useContext(StateContext);
  const dispatch = useContext(DispatchContext);
  const { navigate, currentStep } = useNavigationContext();
  const theme = useContext(ThemeContext);

  const activeChildId = cardCategory.match(currentStep)
    ? currentStep.params
    : null;

  const handleClickAddCategory = () => {
    const id = nanoid();
    dispatch(store.creators.addCardCategory({ id }));
    navigate("here", cardCategory(id));
  };

  const setCardCategories = useCallback(
    (newCardCategoryIds: string[]) => {
      const newCardCategories = settings.cardCategories.toSorted(
        (a, b) =>
          newCardCategoryIds.indexOf(a.id) - newCardCategoryIds.indexOf(b.id),
      );
      dispatch(store.creators.setCardCategories({ newCardCategories }));
    },
    [dispatch, settings.cardCategories],
  );

  const { hoverBg, selectedBg, selectedHoverBg } = useMemo(() => {
    return {
      hoverBg: theme.colors.bgOpaquePrimary,
      selectedBg: irid(theme.colors.glow)
        .blend(theme.colors.bgOpaquePrimary, 0.8)
        .toString(),
      selectedHoverBg: irid(theme.colors.glow)
        .blend(theme.colors.bgOpaquePrimary, 0.9)
        .toString(),
    };
  }, [theme]);

  const renderRow = useCallback(
    (id: string) => {
      const category = settings.cardCategories.find((c) => c.id === id);
      if (category === undefined) {
        return null;
      }
      return (
        <Link
          key={id}
          to={cardCategory(id)}
          css={{
            gridColumn: "1/-1",
            display: "grid",
            gridTemplateColumns: "subgrid",
            "&:hover": {
              backgroundColor: hoverBg,
            },
            ...(activeChildId === id
              ? {
                  backgroundColor: selectedBg,
                  "&:hover": {
                    backgroundColor: selectedHoverBg,
                  },
                }
              : {}),
          }}
        >
          <div
            css={{
              gridColumn: "1",
              padding: "0.3em",
              textShadow: "none",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {category.singleName}
          </div>

          <div
            css={{
              gridColumn: "2",
              padding: "0.3em",
              textShadow: "none",
              color: theme.colors.text,
              fontStyle: "italic",
              opacity: 0.7,
            }}
          >
            {category.styleKey}
          </div>
        </Link>
      );
    },
    [
      activeChildId,
      hoverBg,
      selectedBg,
      selectedHoverBg,
      settings.cardCategories,
      theme.colors.text,
    ],
  );

  return (
    <div
      css={{
        ...absoluteCover,
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.colors.backgroundPrimary,
        border: `1px solid ${theme.colors.controlBorder}`,
        padding: "0.5em",
        marginTop: "0.5em",
      }}
    >
      <h2>
        <Translate>Card categories</Translate>
      </h2>

      <p>
        <Button css={{ width: "auto" }} onClick={handleClickAddCategory}>
          Add category
        </Button>
      </p>

      <SortableTable
        css={{
          flex: 1,
          overflow: "auto",
          gridAutoRows: "2em",
          position: "relative",
        }}
        items={settings.cardCategories.map((c) => c.id)}
        setItems={setCardCategories}
        renderItem={renderRow}
        gridTemplateColumns="1fr 1fr 1fr"
        headers={[
          { label: "Category", id: "category" },
          { label: "Style Key", id: "styleKey" },
        ]}
        emptyMessage={
          <p>
            <Translate>No card categories have been added yet.</Translate>
          </p>
        }
      />
    </div>
  );
};

Categories.displayName = "Categories";
