#!/usr/bin/env bash

set -eu

dir=$(dirname "$0")

. "$dir/base_release.sh"

base_release v
