#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"
export ASPNETCORE_URLS="${ASPNETCORE_URLS:-http://localhost:5006}"
export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_DB="${POSTGRES_DB:-masarat_epm}"
export POSTGRES_USER="${POSTGRES_USER:-masarat_epm}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
export HR_SERVICE_URL="${HR_SERVICE_URL:-http://localhost:5001}"
export Jwt__Key="${Jwt__Key:-development-only-secret-key-change-me-32chars}"

cd "$ROOT_DIR"
dotnet run --project backend/modules/epm/Masarat.EPM.API/Masarat.EPM.API.csproj
