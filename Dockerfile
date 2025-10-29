# syntax=docker/dockerfile:1.7

# --- Base image ---
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev=false

# --- Generate Prisma Client (if schema present) ---
FROM deps AS prisma
WORKDIR /app
COPY prisma ./prisma
RUN npx prisma generate || echo "Prisma not configured, skipping generate"

# --- Build ---
FROM prisma AS build
WORKDIR /app
COPY . .
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Ensure Next.js can run
ENV PORT=3000
EXPOSE 3000

# Copy production node_modules and build artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
# Some projects may not have a public directory; create an empty one to satisfy Next.js
RUN mkdir -p ./public
COPY --from=build /app/package.json ./package.json

# If Prisma is used at runtime, include generated client
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=prisma /app/prisma ./prisma

CMD ["npm", "start"]


