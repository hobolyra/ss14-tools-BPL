#!/usr/bin/env bash
set -eu

# Set to script directory.
cd "$(dirname "$0")"

# CD to repo parent directory.
cd ../../

# Run server
npx http-server -c-1
