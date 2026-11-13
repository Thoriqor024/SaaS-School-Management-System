#!/bin/sh
set -e

cd /var/www/html

PORT="${PORT:-80}"

# Render's generateValue produces raw base64; Laravel wants the base64: prefix.
if [ -n "$APP_KEY" ]; then
    case "$APP_KEY" in
        base64:*) ;;
        *) export APP_KEY="base64:$APP_KEY" ;;
    esac
fi

# Render exposes the public hostname, so APP_URL does not need to be set by hand.
if [ -z "$APP_URL" ] && [ -n "$RENDER_EXTERNAL_URL" ]; then
    export APP_URL="$RENDER_EXTERNAL_URL"
fi

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
    storage/logs storage/fonts bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
php artisan storage:link --force >/dev/null 2>&1 || true

# The managed database can take a few seconds to accept connections.
tries=0
until php artisan migrate --force; do
    tries=$((tries + 1))
    if [ "$tries" -ge 20 ]; then
        echo "Database migrations failed after $tries attempts." >&2
        exit 1
    fi
    echo "Waiting for the database (attempt $tries)..." >&2
    sleep 3
done

if [ "${SEED_DEMO:-false}" = "true" ]; then
    php artisan db:seed --force || true
fi

php artisan config:cache
php artisan view:cache

sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
