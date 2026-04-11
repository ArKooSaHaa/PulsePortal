#!/bin/bash

# No 'set -e' — we want the web server to start even if artisan commands fail

echo "🚀 Starting PulsePortal Deployment Script..."

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