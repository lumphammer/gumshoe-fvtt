import system from "../../public/system.json";
import { systemLogger } from "../functions/utilities";

export const describeDocument = (document: {
  id?: string;
  name?: string;
  uuid?: string;
}) =>
  `${document.name ?? "Unnamed document"} (${document.uuid ?? document.id ?? "unknown id"})`;

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * Collects migration failures as we go, so that one bad document doesn't stop
 * us migrating the rest, but the run as a whole still reports as failed. The
 * caller is expected to check `failures` at the end and throw.
 */
export const createFailureCollector = () => {
  const failures: string[] = [];
  return {
    failures,
    record: (scope: string, error: unknown) => {
      const message = `${scope}: ${errorMessage(error)}`;
      failures.push(message);
      systemLogger.error(
        new Error(`Failed ${system.title} system migration for ${message}`),
      );
    },
  };
};
