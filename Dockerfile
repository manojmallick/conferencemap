# Dockerfile
# Multi-stage build - minimal Cloud Run image

# Stage 1: Install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build Next.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Activate the KendoReact license if present (telerik-license.txt is uploaded via
# .gcloudignore). Non-fatal: the build still succeeds (with watermark) if absent.
RUN npx --yes kendo-ui-license activate || echo "[kendo] no license — building with watermark"
RUN npm run build

# Stage 3: Production runtime (smallest possible)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone build (output: standalone in next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
# Copy corpus JSON (needed at runtime for SigMap)
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/corpus   ./src/lib/corpus

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
