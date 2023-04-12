import * as core from "@actions/core";

async function run(): Promise<void> {
  try {
    const text = core.getInput("text");
    const regex = core.getInput("regex");
    const flags = core.getInput("flags");

    const re = new RegExp(regex, flags);

    const result = re.exec(text);

    if (result) {
      for (const [index, x] of result.entries()) {
        if (index === 10) {
          return;
        }

        if (index === 0) {
          core.setOutput("match", x);
          continue;
        }

        core.setOutput(`group${index}`, x);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed(error.message as string);
    } else if (typeof error === "string") {
      core.setFailed(error);
    }
  }
}

run();
