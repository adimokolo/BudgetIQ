#!/usr/bin/env bash
set -euo pipefail

echo "==> Building local BudgetIQ images..."
docker compose build

echo "==> Starting local containers..."
docker compose up -d --force-recreate

echo "==> Waiting for backend health..."
for i in {1..30}; do
  status="$(docker inspect --format='{{.State.Health.Status}}' budgetiq-backend 2>/dev/null || true)"

  if [ "$status" = "healthy" ]; then
    break
  fi

  if [ "$status" = "unhealthy" ]; then
    echo "ERROR: Backend became unhealthy."
    docker compose ps
    exit 1
  fi

  if [ "$i" -eq 30 ]; then
    echo "ERROR: Backend did not become healthy in time."
    docker compose ps
    exit 1
  fi

  sleep 2
done

echo "==> Verifying frontend..."
frontend_status="$(docker inspect --format='{{.State.Status}}' budgetiq-frontend 2>/dev/null || true)"

if [ "$frontend_status" != "running" ]; then
  echo "ERROR: Frontend is not running."
  docker compose ps
  exit 1
fi

echo "==> Local deployment healthy."
docker compose ps

echo
./scripts/docker-cleanup-local.sh
