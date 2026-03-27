FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
