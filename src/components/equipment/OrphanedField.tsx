import { Fragment } from "react";

import { Button } from "../inputs/Button";
import { Translate } from "../Translate";

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
        css={{
          gridColumn: "1",
          gridRow: index * gridRowsPerField + 1,
        }}
      >
        Id
      </b>
      <code
        css={{
          gridColumn: 2,
          gridRow: index * gridRowsPerField + 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {fieldId}
      </code>
      <a
        title="Copy field ID to clipboard"
        css={{
          gridColumn: 3,
          gridRow: index * gridRowsPerField + 1,
        }}
        onClick={async () => {
          await game.clipboard?.copyPlainText(fieldId);
          ui.notifications?.info(`Copied field ID "${fieldId}" to clipboard`);
        }}
      >
        <i className={"fa fa-copy"} />
      </a>
      <b
        css={{
          gridColumn: "1",
          gridRow: index * gridRowsPerField + 2,
        }}
      >
        Value
      </b>
      <code
        css={{
          gridColumn: 2,
          gridRow: index * gridRowsPerField + 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {fieldValue}
      </code>
      <a
        title="Copy field value to clipboard"
        css={{
          gridColumn: 3,
          gridRow: index * gridRowsPerField + 2,
        }}
        onClick={async () => {
          await game.clipboard?.copyPlainText(String(fieldValue));
          ui.notifications?.info("Copied value to clipboard");
        }}
      >
        <i className={"fa fa-copy"} />
      </a>
      <Button
        css={{
          gridColumn: 4,
          gridRow: `${index * gridRowsPerField + 1} / ${
            index * gridRowsPerField + 3
          }`,
        }}
        onClick={() => {
          onDelete(fieldId);
        }}
      >
        <Translate>Delete</Translate>
      </Button>
      <hr
        css={{
          gridColumn: "1 / -1",
          gridRow: index * gridRowsPerField + 3,
        }}
      />
    </Fragment>
  );
};

OrphanedField.displayName = "OrphanedField";
