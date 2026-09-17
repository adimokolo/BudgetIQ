FROM node:24-alpine

ENV NODE_ENV=production

WORKDIR /app


COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force


COPY . .

RUN apk add --no-cache curl

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
