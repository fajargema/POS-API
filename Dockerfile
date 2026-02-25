# ── Stage 1: Build ──
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema and config, generate client
# Dummy DATABASE_URL needed for prisma.config.ts (generate only needs the schema, not a real DB)
COPY prisma ./prisma/
COPY prisma.config.ts ./
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# ── Stage 2: Production ──
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated Prisma client from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy prisma schema and config (needed at runtime)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Copy application source
COPY src ./src/

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
