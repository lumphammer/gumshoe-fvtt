#!/usr/bin/env bash

# Manage a local Foundry server for the Playwright tests (`pnpm e2e`), separate
# from the one you develop against, so the tests can throw their world away.
#
# Usage: scripts/e2e-foundry.sh up|down|restart|logs
#
# `up` creates (or starts) a podman container running Foundry, with its own
# data folder, and installs a copy of `build/` as the system (the tests'
# global setup refreshes the copy on every run). Foundry checks its licence
# against the machine's hostname, so we copy an already-signed `license.json`
# from another Foundry data folder and give the container the hostname it was
# signed for.
#
# Settings (environment variables):
#   E2E_FOUNDRY_CONTAINER  container name (default fvtt-e2e)
#   E2E_FOUNDRY_IMAGE      image (default ghcr.io/n3dst4/fvtt:14)
#   E2E_FOUNDRY_PORT       host port (default 30099)
#   E2E_FOUNDRY_DATA       data folder (default ~/foundrydata/e2e)
#   E2E_FOUNDRY_LICENSE    signed licence to copy (default: the `dataPath` in
#                          foundryconfig.json, + /Config/license.json)

set -Eeuo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
CONTAINER=${E2E_FOUNDRY_CONTAINER:-fvtt-e2e}
IMAGE=${E2E_FOUNDRY_IMAGE:-ghcr.io/n3dst4/fvtt:14}
PORT=${E2E_FOUNDRY_PORT:-30099}
DATA=${E2E_FOUNDRY_DATA:-$HOME/foundrydata/e2e}

json_field() {
  pnpm --silent --dir "$ROOT" exec node -e \
    'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))[process.argv[2]] ?? "")' \
    "$1" "$2"
}

install_system() {
  if [[ ! -f "$ROOT/build/system.json" ]]; then
    echo "There's no build to test; run \`pnpm build\` first." >&2
    exit 1
  fi
  rm -rf "$DATA/Data/systems/investigator"
  cp -r "$ROOT/build" "$DATA/Data/systems/investigator"
}

up() {
  if podman container exists "$CONTAINER"; then
    if [[ "$(podman container inspect -f '{{.State.Running}}' "$CONTAINER")" == true ]]; then
      echo "Foundry is already up"
      return
    fi
    # copy while Foundry is stopped, so the packs aren't open
    install_system
    podman start "$CONTAINER" >/dev/null
  else
    local license=${E2E_FOUNDRY_LICENSE:-}
    if [[ -z "$license" ]]; then
      license="$(json_field "$ROOT/foundryconfig.json" dataPath)/Config/license.json"
    fi
    if [[ ! -f "$license" ]]; then
      echo "No signed Foundry licence found at $license; set E2E_FOUNDRY_LICENSE." >&2
      exit 1
    fi
    mkdir -p "$DATA/Config" "$DATA/Data/systems" "$DATA/Data/worlds"
    cp "$license" "$DATA/Config/license.json"
    install_system
    # keep-id and label=disable let Foundry write to the bind-mounted folder
    # under rootless podman with SELinux
    podman run -d --name "$CONTAINER" \
      --hostname "$(json_field "$license" host)" \
      --userns=keep-id --security-opt label=disable \
      -p "$PORT:30000" \
      -e DATA_PATH="$DATA" \
      -v "$DATA:$DATA" \
      "$IMAGE" >/dev/null
  fi
  echo "Waiting for Foundry on http://localhost:$PORT"
  for _ in $(seq 60); do
    if curl -s -o /dev/null "http://localhost:$PORT/"; then
      echo "Foundry is up"
      return
    fi
    sleep 1
  done
  echo "Foundry did not start; see: podman logs $CONTAINER" >&2
  exit 1
}

case "${1:-}" in
  up) up ;;
  down) podman stop "$CONTAINER" >/dev/null ;;
  restart)
    podman stop "$CONTAINER" >/dev/null
    up
    ;;
  logs) podman logs -f "$CONTAINER" ;;
  *)
    echo "Usage: $0 up|down|restart|logs" >&2
    exit 1
    ;;
esac
