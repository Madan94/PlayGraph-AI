# Start infra + all workers in Docker (backend stays on host :8002).
# Run from repo root or docker/ folder.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Building and starting postgres, minio, redpanda + all workers..." -ForegroundColor Cyan
Write-Host "Stop local workers first (python -m workers.main) to avoid duplicate Kafka consumers." -ForegroundColor Yellow

docker compose -f docker-compose.workers.yml up -d --build `
  postgres minio redpanda `
  json-worker video-worker image-worker audio-worker

Write-Host ""
Write-Host "Workers running. Tail logs:" -ForegroundColor Green
Write-Host "  docker compose -f docker-compose.workers.yml logs -f video-worker"
Write-Host ""
Write-Host "Ensure host backend is up on port 8002 with AUTH_INTERNAL_SERVICE_KEY in .env"
