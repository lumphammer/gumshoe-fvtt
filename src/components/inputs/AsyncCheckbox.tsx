import React, { useCallback, useEffect, useState } from "react";

import { Checkbox } from "./Checkbox";

type AsyncCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  title?: string;
};

export const AsyncCheckbox = React.memo<AsyncCheckboxProps>(
  ({ checked: checkedProp, onChange: onChangeProp, className, title }) => {
    const [checked, setChecked] = useState(checkedProp);
    useEffect(() => {
      setChecked(checkedProp);
    }, [checkedProp]);

    const onChange = useCallback(
      (checked: boolean) => {
        onChangeProp(checked);
        setChecked(checked);
      },
      [onChangeProp],
    );

    return (
      <Checkbox
        title={title}
        checked={checked}
        onChange={onChange}
        className={className}
      />
    );
  },
);

AsyncCheckbox.displayName = "AsyncCheckbox";
