# ─────────────────────────────────────────────────────────
#  Copa Cards — Dockerfile
#  Build: docker build -t copa-cards .
#  Run:   docker run -p 3000:3000 \
#           -e DATABASE_URL="postgresql://..." \
#           -e JWT_SECRET="..." \
#           copa-cards
# ─────────────────────────────────────────────────────────

# ── Imagem base compartilhada ─────────────────────────────
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# ── Stage 1: instalar dependências ───────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build da aplicação ──────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client com binários para Linux
RUN npx prisma generate

# DATABASE_URL fictícia: Next.js não conecta ao banco durante o build
# (todas as páginas são "use client" — sem SSG com queries)
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: imagem de produção (standalone) ──────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuário sem privilégios (boa prática de segurança)
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Assets públicos (fotos dos jogadores, imagens dos pacotes, banner)
COPY --from=builder /app/public ./public

# Build standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Prisma: schema + binário do query engine (não copiado automaticamente)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/.prisma          ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/@prisma/client   ./node_modules/@prisma/client
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/prisma           ./node_modules/prisma

USER nextjs
EXPOSE 3000

# Sincroniza o schema no banco (idempotente) e inicia o servidor
CMD ["sh", "-c", \
  "node node_modules/prisma/build/index.js db push --skip-generate && node server.js"]
