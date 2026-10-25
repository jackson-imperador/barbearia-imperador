# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client (requires schema.prisma)
RUN npx prisma generate

# Build NestJS application
RUN npm run build

# ─── Stage 2: Runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# Create uploads directory for local storage
RUN mkdir -p uploads

EXPOSE 3001

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma@6.19.3 migrate deploy && node dist/src/main.js"]
