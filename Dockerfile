FROM nginx

WORKDIR /usr/share/nginx/html

RUN rm 50x.html
RUN rm index.html

COPY dist/modules/ .
COPY confs/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
