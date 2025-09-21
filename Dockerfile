FROM node:20-alpine

# Install build dependencies for sqlite3
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and rebuild sqlite3 for current platform
RUN npm ci --omit=dev && npm rebuild sqlite3

# Copy source code
COPY src/ ./src/
COPY db/ ./db/
COPY public/ ./public/
COPY images/ ./images/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
