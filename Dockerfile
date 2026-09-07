# Multi-stage Docker build for Next.js backend from monorepo root
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY next-backend/package*.json ./
COPY next-backend/prisma ./prisma
RUN npm ci

# Copy source and build
COPY next-backend/ ./
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8090

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

EXPOSE 8090
CMD ["npm", "run", "start"]
