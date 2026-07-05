$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
docker compose -f docker-compose.workers.yml down
