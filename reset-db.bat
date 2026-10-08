@echo off
REM ZapTI Database Reset Script for Windows
REM This script completely resets the database (drops all data) and re-runs migrations + seed

echo ============================================
echo ZapTI Database Reset
echo ============================================
echo.
echo This will:
echo 1. Stop all containers
echo 2. Remove named volumes (postgres_data, redis_data, zapti-media, zapti-backups, zapti-logs)
echo 3. Start containers fresh
echo 4. Run database migrations
echo 5. Seed the database
echo.
echo WARNING: ALL DATA WILL BE LOST!
echo.
set /p confirm=Are you sure you want to continue? (y/N): 
if /i not  %confirm%==y (
    echo Cancelled.
    exit /b 1
)

echo.
echo [1/5] Stopping containers and removing volumes...
docker compose down -v --remove-orphans

echo.
echo [2/5] Starting PostgreSQL and Redis...
docker compose up -d postgres redis

echo.
echo [3/5] Waiting for database to be healthy...
timeout /t 10 /nobreak >nul

echo.
echo [4/5] Running database migrations...
docker compose run --rm api npx prisma migrate deploy

echo.
echo [5/5] Seeding database...
docker compose run --rm api npm run db:seed --workspace=packages/database

echo.
echo ============================================
echo Database reset complete!
echo ============================================
echo.
echo You can now start all services with:
echo   docker compose up -d
echo.
echo Then access:
echo   Web UI: http://localhost:3001
echo   API:    http://localhost:3000
echo   Docs:   http://localhost:3000/documentation
