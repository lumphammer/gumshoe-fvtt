import ArrayField = foundry.data.fields.ArrayField;
import NumberField = foundry.data.fields.NumberField;
import SchemaField = foundry.data.fields.SchemaField;
import StringField = foundry.data.fields.StringField;

// /////////////////////////////////////////////////////////////////////////////
// schema which has a property which is (number | undefined)[]
const _optionalNumberArraySchema = {
  numbers: new ArrayField(
    new NumberField({
      nullable: false,
      required: false, // <-- can be undefined
    }),
    {
      nullable: false,
      required: true,
      initial: [],
    },
  ),
};

// { numbers: (number | undefined)[]; }
//                      ^^^^^^^^^ <-- correct
type _NumberArray = SchemaField.InitializedData<
  typeof _optionalNumberArraySchema
>;

// number | undefined
type _NumberArrayElement = _NumberArray["numbers"][number];

// /////////////////////////////////////////////////////////////////////////////
// schema which has a property which should be ({ name: string; } | undefined)[]
const _optionalObjectArraySchema = {
  objects: new ArrayField(
    new SchemaField(
      {
        name: new StringField({
          nullable: false,
          required: true,
        }),
      },
      {
        nullable: true,
        required: false, // <-- can be undefined
      },
    ),
    {
      nullable: false,
      required: true,
      initial: [],
    },
  ),
};

// { objects: { name: string; }[]; }
//                            ^-----------no "| undefined"
type _ObjectArray = SchemaField.InitializedData<
  typeof _optionalObjectArraySchema
>;

// { name: string; }
type _ObjectArrayElement = _ObjectArray["objects"][number];
