#!/bin/sh
set -e

# Ensure PHP-FPM socket directory exists
mkdir -p /var/run/php-fpm

# Ensure data directory has correct permissions
if [ -f /var/www/html/api/data.json ]; then
    chown nginx:nginx /var/www/html/api/data.json
fi
if [ -d /var/www/html/api/snapshots ]; then
    chown -R nginx:nginx /var/www/html/api/snapshots
fi

# Start PHP-FPM in background
php-fpm83 -D

# Start nginx in foreground
exec nginx -g "daemon off;"
