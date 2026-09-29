import type { TaskArgs } from "../types";

export function helloWorld({ log }: TaskArgs) {
  log("Hello, world!");
}

helloWorld.description = "Say hello from task-core";
