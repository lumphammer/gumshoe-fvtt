import { getTranslated } from "../../functions/getTranslated";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useOtherable } from "../../hooks/useOtherable";
import { css, cx } from "../../styled-system/css";
import { badge, select } from "../../styled-system/recipes";
import { Translate } from "../Translate";
import { AsyncTextInput } from "./AsyncTextInput";
import { useContext } from "react";
import { IdContext, labelIdFor } from "../IdContext";

type OtherableDropDownProps = {
  value: string;
  onChange: (newValue: string) => void | PromiseLike<unknown>;
  className?: string;
  pickerValues: readonly string[];
  validValues?: readonly string[];
  /** its name, for one with no label (in a `GridField`, say) to name it */
  label?: string;
};

export const OtherableDropDown = ({
  value: selectedValue,
  onChange,
  className,
  pickerValues,
  validValues,
  label,
}: OtherableDropDownProps) => {
  const id = useContext(IdContext);
  const {
    customValueToken,
    effectiveValue,
    handleChange,
    showCustomValue,
    notFound,
  } = useOtherable({
    value: selectedValue,
    onChange,
    pickerValues,
    validValues,
  });
  const isEditable = useIsEditable();

  return (
    <div
      className={cx(
        className,
        css({ display: "flex", flexDirection: "column", gap: "0.2em" }),
      )}
    >
      <select
        aria-label={label}
        // in a `GridField`, by its label (the id is the text input's, for an
        // "Other" value)
        aria-labelledby={label === undefined && id ? labelIdFor(id) : undefined}
        className={select()}
        value={effectiveValue}
        onChange={handleChange}
        disabled={!isEditable}
      >
        {pickerValues.map((value) => (
          <option key={value}>{value}</option>
        ))}
        <option value={customValueToken}>{getTranslated("Other")}</option>
      </select>
      {showCustomValue && (
        <AsyncTextInput
          value={selectedValue}
          onChange={onChange}
          ariaLabel={label}
        />
      )}
      {notFound && (
        <span
          className={cx(
            badge({ tone: "danger", weight: "strong" }),
            css({ alignSelf: "start" }),
          )}
        >
          <Translate>NotFound!</Translate>
        </span>
      )}
    </div>
  );
};

OtherableDropDown.displayName = "OtherableDropDown";
