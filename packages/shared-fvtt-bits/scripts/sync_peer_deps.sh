#! /bin/bash

set -eu

dir=$(dirname "$0")

# hunt upwards for nearest package.json
while [ ! -f "$dir/package.json" ]; do
    if [ "$dir" = "/" ]; then
        echo "No package.json found"
        exit 1
    fi
    dir=$(dirname "$dir")
done

# install peer dependencies as actual dependencies
jq -r '.peerDependencies | to_entries[] | "\(.key)@\(.value)"' "$dir/package.json" | xargs pnpm add
