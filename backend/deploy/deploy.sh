#!/bin/bash
# EC2에서 실행되는 배포 본체. deploy-entry.sh가 최신 코드를 받은 뒤 이 스크립트를 실행한다.
# 컨테이너 중 소스가 바뀐 것만 다시 빌드·재시작되고, 나머지는 그대로 유지된다.
set -euo pipefail

cd "$(dirname "$0")/.."   # backend/

echo "== $(date '+%F %T') deploy start ($(git rev-parse --short HEAD))"
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f > /dev/null
docker compose -f docker-compose.prod.yml ps
echo "== deploy done"
