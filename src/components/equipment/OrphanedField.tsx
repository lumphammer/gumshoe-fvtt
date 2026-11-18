import { Fragment } from "react";

import { Button } from "../inputs/Button";
import { Translate } from "../Translate";
import { css } from "../../styled-system/css";

interface OrphanedFieldProps {
  fieldId: string;
  fieldValue: string | number | boolean;
  index: number;
  onDelete: (id: string) => void;
}

const gridRowsPerField = 3;

export const OrphanedField = ({
  fieldId,
  index,
  fieldValue,
  onDelete,
}: OrphanedFieldProps) => {
  return (
    <Fragment key={fieldId}>
      <b
        className={css({
          gridColumn: "1",
        })}
        style={{ gridRow: index * gridRowsPerField + 1 }}
      >
        Id
      </b>
      <code
        className={css({
          gridColumn: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        })}
        style={{ gridRow: index * gridRowsPerField + 1 }}
      >
        {fieldId}
      </code>
      <a
        title="Copy field ID to clipboard"
        className={css({
          gridColumn: 3,
        })}
        style={{ gridRow: index * gridRowsPerField + 1 }}
        onClick={async () => {
          await game.clipboard?.copyPlainText(fieldId);
          ui.notifications?.info(`Copied field ID "${fieldId}" to clipboard`);
        }}
      >
        <i className={"fa fa-copy"} />
      </a>
      <b
        className={css({
          gridColumn: "1",
        })}
        style={{ gridRow: index * gridRowsPerField + 2 }}
      >
        Value
      </b>
      <code
        className={css({
          gridColumn: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        })}
        style={{ gridRow: index * gridRowsPerField + 2 }}
      >
        {fieldValue}
      </code>
      <a
        title="Copy field value to clipboard"
        className={css({
          gridColumn: 3,
        })}
        style={{ gridRow: index * gridRowsPerField + 2 }}
        onClick={async () => {
          await game.clipboard?.copyPlainText(String(fieldValue));
          ui.notifications?.info("Copied value to clipboard");
        }}
      >
        <i className={"fa fa-copy"} />
      </a>
      <Button
        className={css({
          gridColumn: 4,
        })}
        style={{
          gridRow: `${index * gridRowsPerField + 1} / ${index * gridRowsPerField + 3}`,
        }}
        onClick={() => {
          onDelete(fieldId);
        }}
      >
        <Translate>Delete</Translate>
      </Button>
      <hr
        className={css({
          gridColumn: "1 / -1",
        })}
        style={{ gridRow: index * gridRowsPerField + 3 }}
      />
    </Fragment>
  );
};

OrphanedField.displayName = "OrphanedField";
