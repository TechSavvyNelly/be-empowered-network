# Static site served by nginx. Railway builds this automatically.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY . /usr/share/nginx/html
# Railway injects PORT; nginx's template mechanism substitutes it at start-up.
ENV PORT=8080
EXPOSE 8080
