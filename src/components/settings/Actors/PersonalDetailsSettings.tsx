import { Link, useNavigationContext } from "@lumphammer/minirouter";
import { useCallback, useContext } from "react";

import { Button } from "../../inputs/Button";
import { SortableTable } from "../../sortableTable";
import { Translate } from "../../Translate";
import { ModifyContext, StateContext } from "../contexts";
import type { Setters } from "../types";
import { useListHoverBg } from "../useListHoverBg";
import { personalDetail } from "./directions";

/**
 * Personal details don't have ids, so we use their positions in the list as
 * sortable ids and route params.
 */
export const PersonalDetailsSettings = ({ setters }: { setters: Setters }) => {
  const { settings } = useContext(StateContext);
  const modify = useContext(ModifyContext);
  const { navigate } = useNavigationContext();
  const hoverBg = useListHoverBg();

  const handleClickAdd = useCallback(() => {
    const index = settings.personalDetails.length;
    modify((s) => {
      s.personalDetails.push({ name: "", type: "text" });
    });
    navigate("here", personalDetail(index));
  }, [modify, navigate, settings.personalDetails.length]);

  const setOrder = useCallback(
    (newOrder: string[]) => {
      setters.personalDetails(
        newOrder.map((i) => settings.personalDetails[Number(i)]),
      );
    },
    [setters, settings.personalDetails],
  );

  const renderRow = useCallback(
    (id: string) => {
      const detail = settings.personalDetails[Number(id)];
      return (
        <Link
          to={personalDetail(Number(id))}
          css={{
            gridColumn: "1/-1",
            display: "grid",
            gridTemplateColumns: "subgrid",
            textShadow: "none",
            "&:hover, &:focus-visible": {
              backgroundColor: hoverBg,
            },
          }}
        >
          <div
            css={{
              padding: "0.3em",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {detail.name || (
              <i>
                <Translate>Unnamed</Translate>
              </i>
            )}
          </div>
          <div css={{ padding: "0.3em", fontStyle: "italic", opacity: 0.7 }}>
            <Translate>{detail.type === "item" ? "Item" : "Text"}</Translate>
          </div>
        </Link>
      );
    },
    [hoverBg, settings.personalDetails],
  );

  return (
    <div
      css={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <p css={{ marginTop: 0 }}>
        <Button css={{ width: "auto" }} onClick={handleClickAdd}>
          <i className="fas fa-plus" />{" "}
          <Translate>Add personal detail</Translate>
        </Button>
      </p>
      <SortableTable
        css={{ flex: 1, overflow: "auto", position: "relative" }}
        items={settings.personalDetails.map((_, i) => i.toString())}
        setItems={setOrder}
        renderItem={renderRow}
        gridTemplateColumns="1fr max-content"
        headers={[
          { label: "Name", id: "name" },
          { label: "Type", id: "type" },
        ]}
        emptyMessage={
          <p>
            <i>
              <Translate>Empty List</Translate>
            </i>
          </p>
        }
      />
    </div>
  );
};

PersonalDetailsSettings.displayName = "PersonalDetailsSettings";
