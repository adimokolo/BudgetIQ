#!/usr/bin/env bash
set -euo pipefail

echo "==> Cleaning unused dangling Docker images..."
docker image prune -f

echo "==> Cleaning build cache older than 7 days..."
docker builder prune -f --filter "until=168h"

echo
echo "==> Docker disk usage after cleanup:"
docker system df
