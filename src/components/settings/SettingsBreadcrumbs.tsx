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
import { personalDetail } from "./Actors/directions";
import { cardCategory, categoryDangerZone } from "./Cards/directions";
import { StateContext } from "./contexts";

type PageWithLabel = { direction: AnyDirection; label: string };

type SettingsBreadcrumbsProps = {
  /** directions with a fixed label, and their sub-pages, if any */
  pages: (PageWithLabel & { subPages?: PageWithLabel[] })[];
};

/**
 * Shows the path to the current settings panel, with a link to each step on
 * the way. Must be rendered at the root of the settings router.
 */
export const SettingsBreadcrumbs = ({ pages }: SettingsBreadcrumbsProps) => {
  const theme = useContext(ThemeContext);
  const { settings } = useContext(StateContext);
  const { currentStep, childSteps } = useNavigationContext();
  const path = currentStep ? [currentStep, ...childSteps] : [];

  const getLabel = (step: AnyStep): ReactNode => {
    const page = pages
      .flatMap((p) => [p, ...(p.subPages ?? [])])
      .find(({ direction }) => direction.match(step));
    if (page) {
      return <Translate>{page.label}</Translate>;
    }
    if (cardCategory.match(step)) {
      const category = settings.cardCategories.find(
        (c) => c.id === step.params,
      );
      return category?.singleName ?? <Translate>Card category</Translate>;
    }
    if (personalDetail.match(step)) {
      return (
        settings.personalDetails[step.params]?.name || (
          <Translate>Unnamed</Translate>
        )
      );
    }
    if (categoryDangerZone.match(step)) {
      return <Translate>Danger Zone</Translate>;
    }
    return step.direction.description;
  };

  const crumbs = [
    { key: "home", to: [], label: <Translate>Settings Home</Translate> },
    ...path.map((step, i) => ({
      key: step.id,
      to: path.slice(0, i + 1),
      label: getLabel(step),
    })),
  ];

  return (
    <nav
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
