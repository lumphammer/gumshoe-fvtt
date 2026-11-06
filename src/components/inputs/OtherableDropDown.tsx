import { getTranslated } from "../../functions/getTranslated";
import { useIsEditable } from "../../hooks/useIsEditable";
import { useOtherable } from "../../hooks/useOtherable";
import { css, cx } from "../../styled-system/css";
import { badge, select } from "../../styled-system/recipes";
import { Translate } from "../Translate";
import { AsyncTextInput } from "./AsyncTextInput";

type OtherableDropDownProps = {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  pickerValues: readonly string[];
  validValues?: readonly string[];
};

export const OtherableDropDown = ({
  value: selectedValue,
  onChange,
  className,
  pickerValues,
  validValues,
}: OtherableDropDownProps) => {
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
      css={{ display: "flex", flexDirection: "column", gap: "0.2em" }}
      className={className}
    >
      <select
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
        <AsyncTextInput value={selectedValue} onChange={onChange} />
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
