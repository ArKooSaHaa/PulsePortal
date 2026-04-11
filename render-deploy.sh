#!/bin/bash

# NOTE: Do NOT use 'set -e' here — if any artisan command fails (e.g. DB not
# ready yet), we still want the web server to start so Render's health check passes.

echo "🚀 Starting PulsePortal Deployment Script..."

echo "⏳ Waiting for database to be ready..."
# Use a simple TCP check — works without Laravel being bootstrapped
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
for i in $(seq 1 30); do
    if (echo > /dev/tcp/$DB_HOST/$DB_PORT) 2>/dev/null; then
        echo "   ✅ Database is reachable!"
        break
    fi
    echo "   DB not ready yet (attempt $i/30), retrying in 5s..."
    sleep 5
done

echo "🧹 Clearing stale cache..."
php artisan config:clear  || echo "⚠️  config:clear failed (non-fatal)"
php artisan cache:clear   || echo "⚠️  cache:clear failed (non-fatal)"
php artisan route:clear   || echo "⚠️  route:clear failed (non-fatal)"
php artisan view:clear    || echo "⚠️  view:clear failed (non-fatal)"

echo "⚙️  Caching config for production..."
php artisan config:cache  || echo "⚠️  config:cache failed (non-fatal)"
php artisan route:cache   || echo "⚠️  route:cache failed (non-fatal)"
php artisan view:cache    || echo "⚠️  view:cache failed (non-fatal)"

echo "🗄️  Running migrations..."
php artisan migrate --force || echo "⚠️  migrate failed (non-fatal — check DB env vars)"

echo "🚀 Starting Web Server (nginx + php-fpm)..."
exec /start.sh
