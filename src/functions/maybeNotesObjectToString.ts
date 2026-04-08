export const maybeNotesObjectToString = (value: any) => {
  if (typeof value === "string") {
    return value;
  }
  return value?.html ?? "";
};
