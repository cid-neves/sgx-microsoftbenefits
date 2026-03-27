FROM nginx:alpine

# Bake config and all static files into the image
# (avoids bind-mount issues in Portainer GitOps deployments)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html        /var/www/html/index.html
COPY styles/           /var/www/html/styles/
COPY src/              /var/www/html/src/

EXPOSE 80
