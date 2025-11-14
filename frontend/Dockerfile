FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# copy your built/static files (index.html etc.)
COPY index.html ./

# add nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80