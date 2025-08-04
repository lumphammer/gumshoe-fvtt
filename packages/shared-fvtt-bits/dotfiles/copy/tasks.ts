#!/usr/bin/env -S sh -c '"`dirname $0`/node_modules/.bin/tsx" "$0" "$@"'

// The above shebang line is a hack to run this under the locally installed
// tsx, without having to install it globally. See
// https://stackoverflow.com/questions/20095351/shebang-use-interpreter-relative-to-the-script-path
//
// tsx is a wrapper around node that allows you to run typescript.
// https://github.com/privatenumber/tsx

import { boot } from "@lumphammer/shared-fvtt-bits/task-core/boot";
import {
  buildPackTranslations,
  clean,
  copyPacksBack,
  link,
  packidge,
  unlink,
} from "@lumphammer/shared-fvtt-bits/task-core/tasks";
import path from "path";
import { fileURLToPath } from "url";

const rootPath = path.dirname(fileURLToPath(import.meta.url));

void boot({
  config: {
    rootPath,
    publicPath: "public",
    manifestName: "system.json",
    buildPath: "build",
    packagePath: "build_package",
  },

  commands: [
    link,
    unlink,
    clean,
    packidge,
    buildPackTranslations,
    copyPacksBack,
  ],
});
