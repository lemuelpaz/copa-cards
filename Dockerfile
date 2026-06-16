# ─────────────────────────────────────────────────────────
#  Copa Cards — Dockerfile
#  Build: docker build -t copa-cards .
#  Run:   docker run -p 3000:3000 \
#           -e DATABASE_URL="postgresql://..." \
#           -e JWT_SECRET="..." \
#           copa-cards
# ─────────────────────────────────────────────────────────

# ── Imagem base ───────────────────────────────────────────
FROM node:20-slim AS base
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# ── Stage 1: dependências ─────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client com binários para Linux (debian e musl/alpine)
RUN npx prisma generate

# Next.js não conecta ao banco durante o build (todas as páginas são client-side)
# DATABASE_URL é exigida apenas em runtime pelas API routes
# NODE_ENV=production NÃO deve ser setado aqui — causaria pre-render das API routes
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: imagem de produção ───────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuário sem privilégios root
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Assets públicos (fotos dos jogadores, pacotes, banner)
COPY --from=builder /app/public ./public

# Output standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Prisma: query engine + todos os pacotes @prisma/* + CLI para rodar db push no startup
# @prisma/engines é necessário para o schema engine (db push/migrate)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma  ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma   ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma                ./prisma

USER nextjs
EXPOSE 3000

# Sincroniza o schema com o banco antes de iniciar o servidor
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss && node server.js"]
