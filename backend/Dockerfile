FROM node:24-alpine

# Set production environment to optimize express performance
ENV NODE_ENV=production

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Install curl for healthcheck (alpine doesn't include it by default)
RUN apk add --no-cache curl

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
