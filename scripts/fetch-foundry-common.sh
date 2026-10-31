#!/usr/bin/env sh
# Copy Foundry's `common/` sources out of the dev container into
# `.foundry-common/` (gitignored), so benchmarks can use Foundry's own
# `mergeObject`, `deepClone` and operators rather than a reimplementation.
set -eu
cd "$(dirname "$0")/.."
container="${1:-fvtt-v14}"
rm -rf .foundry-common
podman cp "$container:/home/foundry/app/common" .foundry-common
echo "Copied Foundry common/ from $container to .foundry-common/"
