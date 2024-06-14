# The image to pull the base configuration from
FROM nginx:stable-alpine
# Copy the custom default.conf from the WORKDIR (.) and overwrite the existing internal configuration in the NGINX container
COPY ./default.conf /etc/nginx/conf.d/default.conf
