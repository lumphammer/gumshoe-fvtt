import { AnyObject } from "fvtt-types/utils";

import SchemaField = foundry.data.fields.SchemaField;
import StringField = foundry.data.fields.StringField;
import ObjectField = foundry.data.fields.ObjectField;
import DataField = foundry.data.fields.DataField;

export const notesWithFormatField = () =>
  new SchemaField({
    format: new StringField({
      nullable: false,
      required: true,
      choices: ["plain", "richText", "markdown"],
    }),
    source: new StringField({ nullable: false, required: true }),
    html: new StringField({ nullable: false, required: true }),
  });

export const recordField = <T extends AnyObject>(
  options: DataField.Options<T>,
) => new ObjectField<DataField.Options<T>, T, T, T>(options);
