#!/bin/sh
redis-server --daemonize yes
sleep 2
node /app/server/data/server.js &
exec nginx -g "daemon off;"
