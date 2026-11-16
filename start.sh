#!/bin/sh
redis-server --daemonize yes
node /app/server/data/server.js &
exec nginx -g "daemon off;"
