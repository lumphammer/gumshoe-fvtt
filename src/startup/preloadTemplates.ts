// this is a legacy bit from classic foundry-style dev but i'm leaving it around
export const preloadTemplates = async function () {
  const templatePaths: string[] = [
    // Add paths to "systems/investigator/templates"
  ];

  return loadTemplates(templatePaths);
};
