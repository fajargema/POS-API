# Single-stage production build
FROM node:22-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (needed for prisma generate)
COPY package*.json ./
RUN npm ci

# Copy prisma schema, config, and source
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY src ./src/

# Generate Prisma client
RUN npx prisma generate

# Remove dev dependencies to slim down
RUN npm prune --omit=dev

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
