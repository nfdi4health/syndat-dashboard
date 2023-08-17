FROM docker.io/library/nginx:alpine
EXPOSE 80
COPY ./build /var/www
COPY nginx.conf.template /etc/nginx/nginx.conf
RUN apk add --no-cache tzdata jq
RUN cp /usr/share/zoneinfo/Europe/Brussels /etc/localtime
RUN echo "Europe/Brussels" >  /etc/timezone

RUN chmod +w /var/www
CMD ["nginx", "-g", "daemon off;"]
