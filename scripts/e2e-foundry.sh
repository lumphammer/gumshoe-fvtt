#!/usr/bin/env bash

# Manage the local Foundry servers for the Playwright tests (`pnpm e2e`),
# separate from the one you develop against, so the tests can throw their
# worlds away. There's one server per test worker, so the tests can run side
# by side (a Foundry runs one world at a time).
#
# Usage: scripts/e2e-foundry.sh up|down|restart|logs [server number]
#
# `up` creates (or starts) a podman container running Foundry for each server,
# with its own data folder, and installs a copy of `build/` as the system (the
# tests' global setup refreshes the copy on every run). It also installs the
# latest releases of the modules the tests use (Babele and libWrapper, for the
# pack translations test), so `restart` picks up new releases. Foundry checks
# its licence against the machine's hostname, so we copy an already-signed
# `license.json` from another Foundry data folder and give the containers the
# hostname it was signed for.
#
# Server 0 is the container fvtt-e2e on port 30099, with its data in
# ~/foundrydata/e2e; server 1 is fvtt-e2e-1 on port 30100, in
# ~/foundrydata/e2e-1; and so on (e2e/config.ts works out the same).
#
# Settings (environment variables):
#   E2E_FOUNDRY_SERVERS    how many servers (default 3; keep in step with
#                          e2e/config.ts)
#   E2E_FOUNDRY_CONTAINER  first container's name (default fvtt-e2e)
#   E2E_FOUNDRY_IMAGE      image (default ghcr.io/n3dst4/fvtt:14)
#   E2E_FOUNDRY_PORT       first server's host port (default 30099)
#   E2E_FOUNDRY_DATA       first server's data folder (default
#                          ~/foundrydata/e2e)
#   E2E_FOUNDRY_LICENSE    signed licence to copy (default: the `dataPath` in
#                          foundryconfig.json, + /Config/license.json)

set -Eeuo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SERVERS=${E2E_FOUNDRY_SERVERS:-3}
FIRST_CONTAINER=${E2E_FOUNDRY_CONTAINER:-fvtt-e2e}
IMAGE=${E2E_FOUNDRY_IMAGE:-ghcr.io/n3dst4/fvtt:14}
FIRST_PORT=${E2E_FOUNDRY_PORT:-30099}
FIRST_DATA=${E2E_FOUNDRY_DATA:-$HOME/foundrydata/e2e}

# set CONTAINER, PORT and DATA for server number $1
select_server() {
  if [[ "$1" == 0 ]]; then
    CONTAINER=$FIRST_CONTAINER
    DATA=$FIRST_DATA
  else
    CONTAINER=$FIRST_CONTAINER-$1
    DATA=$FIRST_DATA-$1
  fi
  PORT=$((FIRST_PORT + $1))
}

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

# the modules the tests use, as id=manifest URL
MODULES=(
  "lib-wrapper=https://github.com/ruipin/fvtt-lib-wrapper/releases/latest/download/module.json"
  "babele=https://gitlab.com/riccisi/foundryvtt-babele/raw/master/module/module.json"
)

# download the modules once per run of this script, into MODULES_CACHE
MODULES_CACHE=""
download_modules() {
  [[ -n "$MODULES_CACHE" ]] && return
  MODULES_CACHE=$(mktemp -d)
  trap 'rm -rf "$MODULES_CACHE"' EXIT
  local tmp
  tmp=$(mktemp -d -p "$MODULES_CACHE")
  for module in "${MODULES[@]}"; do
    local id=${module%%=*} manifest_url=${module#*=}
    curl -fsSL -o "$tmp/$id.json" "$manifest_url"
    local download version
    download=$(json_field "$tmp/$id.json" download)
    version=$(json_field "$tmp/$id.json" version)
    echo "Downloading $id $version"
    curl -fsSL -o "$tmp/$id.zip" "$download"
    mkdir -p "$tmp/$id"
    unzip -q "$tmp/$id.zip" -d "$tmp/$id"
    # some zips have the module at the top, some in a folder: take the
    # shallowest module.json
    local module_json
    module_json=$(find "$tmp/$id" -name module.json -printf '%d %p\n' |
      sort -n | head -n 1 | cut -d' ' -f2-)
    mv "$(dirname "$module_json")" "$MODULES_CACHE/$id"
  done
  rm -rf "$tmp"
}

install_modules() {
  download_modules
  mkdir -p "$DATA/Data/modules"
  for module in "${MODULES[@]}"; do
    local id=${module%%=*}
    rm -rf "${DATA:?}/Data/modules/$id"
    cp -r "$MODULES_CACHE/$id" "$DATA/Data/modules/$id"
  done
}

up() {
  if podman container exists "$CONTAINER"; then
    if [[ "$(podman container inspect -f '{{.State.Running}}' "$CONTAINER")" == true ]]; then
      echo "Foundry $CONTAINER is already up"
      return
    fi
    # copy while Foundry is stopped, so the packs aren't open
    install_system
    install_modules
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
    install_modules
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
}

wait_for_server() {
  echo "Waiting for Foundry $CONTAINER on http://localhost:$PORT"
  for _ in $(seq 60); do
    if curl -s -o /dev/null "http://localhost:$PORT/"; then
      echo "Foundry $CONTAINER is up"
      return
    fi
    sleep 1
  done
  echo "Foundry did not start; see: podman logs $CONTAINER" >&2
  exit 1
}

# every e2e container there is, including any beyond E2E_FOUNDRY_SERVERS
all_containers() {
  podman ps -a --format '{{.Names}}' |
    grep -E "^$FIRST_CONTAINER(-[0-9]+)?\$" || true
}

up_all() {
  for ((n = 0; n < SERVERS; n++)); do
    select_server "$n"
    up
  done
  for ((n = 0; n < SERVERS; n++)); do
    select_server "$n"
    wait_for_server
  done
}

down_all() {
  local containers
  containers=$(all_containers)
  if [[ -n "$containers" ]]; then
    # shellcheck disable=SC2086 -- one name per word
    podman stop $containers >/dev/null
  fi
}

case "${1:-}" in
  up) up_all ;;
  down) down_all ;;
  restart)
    down_all
    up_all
    ;;
  logs)
    select_server "${2:-0}"
    podman logs -f "$CONTAINER"
    ;;
  *)
    echo "Usage: $0 up|down|restart|logs [server number]" >&2
    exit 1
    ;;
esac
