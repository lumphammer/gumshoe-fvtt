import {
  type AnyDirection,
  type AnyStep,
  Link,
  useNavigationContext,
} from "@lumphammer/minirouter";
import { Fragment, type ReactNode, useContext } from "react";
import { FaChevronRight } from "react-icons/fa6";

import { getTranslated } from "../../functions/getTranslated";
import { ThemeContext } from "../../themes/ThemeContext";
import { Translate } from "../Translate";
import { npcStats, personalDetail } from "./Actors/directions";
import { cardCategory } from "./Cards/directions";
import { StateContext } from "./contexts";
import { equipmentCategory, equipmentField } from "./Equipment/directions";
import { stat } from "./Stats/directions";

type PageWithLabel = { direction: AnyDirection; label: string };

type SettingsBreadcrumbsProps = {
  /** directions with a fixed label, and their sub-pages, if any */
  pages: (PageWithLabel & { subPages?: PageWithLabel[] })[];
  className?: string;
};

/**
 * Shows the path to the current settings panel, with a link to each step on
 * the way. Must be rendered at the root of the settings router.
 */
export const SettingsBreadcrumbs = ({
  pages,
  className,
}: SettingsBreadcrumbsProps) => {
  const theme = useContext(ThemeContext);
  const { settings } = useContext(StateContext);
  const { currentStep, childSteps } = useNavigationContext();
  const path = currentStep ? [currentStep, ...childSteps] : [];

  const unnamed = <Translate>Unnamed</Translate>;

  // `parent` is the step before this one in the path, for things which are
  // indexed within their parent
  const getLabel = (step: AnyStep, parent: AnyStep | undefined): ReactNode => {
    const page = pages
      .flatMap((p) => [p, ...(p.subPages ?? [])])
      .find(({ direction }) => direction.match(step));
    if (page) {
      return <Translate>{page.label}</Translate>;
    }
    if (cardCategory.match(step)) {
      return settings.cardCategories[step.params]?.singleName || unnamed;
    }
    if (personalDetail.match(step)) {
      return settings.personalDetails[step.params]?.name || unnamed;
    }
    if (stat.match(step)) {
      const stats = settings[npcStats.match(parent) ? "npcStats" : "pcStats"];
      const id = Object.keys(stats)[step.params];
      return (id !== undefined && stats[id].name) || unnamed;
    }
    if (equipmentCategory.match(step)) {
      const category = Object.values(settings.equipmentCategories)[step.params];
      return category?.name || unnamed;
    }
    if (equipmentField.match(step) && equipmentCategory.match(parent)) {
      const category = Object.values(settings.equipmentCategories)[
        parent.params
      ];
      const field = category && Object.values(category.fields)[step.params];
      return field?.name || unnamed;
    }
    return step.direction.description;
  };

  const crumbs = [
    { key: "home", to: [], label: <Translate>Settings Home</Translate> },
    ...path.map((step, i) => ({
      key: step.id,
      to: path.slice(0, i + 1),
      label: getLabel(step, path[i - 1]),
    })),
  ];

  return (
    <nav
      className={className}
      aria-label={getTranslated("Breadcrumbs")}
      css={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.25em 0.5em",
        padding: "0.25em 0.5em 0.5em 0.5em",
        font: theme.displayFont,
        fontSize: "1.2em",
      }}
    >
      {crumbs.map(({ key, to, label }, i) => {
        const isCurrent = i === crumbs.length - 1;
        return (
          <Fragment key={key}>
            {i > 0 && (
              <FaChevronRight css={{ fontSize: "0.7em", opacity: 0.6 }} />
            )}
            {isCurrent ? (
              <span aria-current="page">{label}</span>
            ) : (
              <Link from="root" to={to}>
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
};

SettingsBreadcrumbs.displayName = "SettingsBreadcrumbs";
