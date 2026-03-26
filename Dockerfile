# Benefits26 — nginx + PHP-FPM (Alpine)
FROM nginx:1.27-alpine

# Install PHP-FPM
RUN apk add --no-cache php83 php83-fpm php83-json php83-mbstring

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy PHP-FPM config
COPY docker/php-fpm.conf /etc/php83/php-fpm.d/www.conf

# Copy start script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Copy app source (exclude server-side runtime files — see .dockerignore)
COPY index.html      /var/www/html/index.html
COPY styles/         /var/www/html/styles/
COPY src/            /var/www/html/src/
COPY api/usage.php   /var/www/html/api/usage.php

# Create data and snapshots directories with correct ownership
# NOTE: api/data.json and api/snapshots/ are volume-mounted at runtime.
#       Do NOT copy them here — they live on the server only.
RUN mkdir -p /var/www/html/api/snapshots \
    && chown -R nginx:nginx /var/www/html/api \
    && mkdir -p /var/run/php-fpm

EXPOSE 80

CMD ["/start.sh"]
