FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server .
EXPOSE 8080

CMD ["node","data/server.js"]