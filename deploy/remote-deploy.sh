#!/usr/bin/env bash
# Runs on the EC2 server from ~/crevea-server, invoked over SSH by .github/workflows/deploy.yml.
# Usage: GHCR_USER=... GHCR_TOKEN=... ./remote-deploy.sh ghcr.io/owner/crevea-server:<sha>
# Pulls the new image, runs Prisma migrations, restarts the app and rolls back if it never turns healthy.
set -euo pipefail

IMAGE="$1"
cd "$(dirname "$0")"

if [ ! -s .env ]; then
  echo "Missing ~/crevea-server/.env" >&2
  exit 1
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin > /dev/null
docker pull "$IMAGE"
docker logout ghcr.io > /dev/null

# Keep the running version around so a failed deploy can be rolled back
if docker image inspect crevea-server:current > /dev/null 2>&1; then
  docker tag crevea-server:current crevea-server:previous
fi
docker tag "$IMAGE" crevea-server:current

docker compose up -d --wait postgres redis

echo "Running database migrations"
docker compose run --rm --no-deps app npm run db:deploy

echo "Starting app"
if ! docker compose up -d --wait --wait-timeout 120 app; then
  echo "New version did not become healthy, recent logs:" >&2
  docker compose logs --tail 80 app >&2 || true
  if docker image inspect crevea-server:previous > /dev/null 2>&1; then
    echo "Rolling back to the previous image" >&2
    docker tag crevea-server:previous crevea-server:current
    docker compose up -d --wait --wait-timeout 120 app || true
  fi
  exit 1
fi

# Drop old pulled tags of this image, keeping the ones tagged current/previous
docker images --format '{{.Repository}}:{{.Tag}}' \
  | grep "^${IMAGE%:*}:" | grep -vx "$IMAGE" | xargs -r docker rmi > /dev/null 2>&1 || true
docker image prune -f > /dev/null

echo "Deployed $IMAGE"
