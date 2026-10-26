# Production image for the Crevea API (modular monolith in services/app + packages/shared).
# Built by .github/workflows/deploy.yml, pushed to GHCR and run on EC2 via deploy/docker-compose.prod.yml.

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first so this layer is cached until a package file changes
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY services/app/package.json services/app/
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma prisma
COPY packages/shared packages/shared
COPY services/app services/app
# prisma generate only needs a syntactically valid URL, never connects
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build


FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
# tsc emits the app to /app/dist, outside services/app, so packages npm nests under
# services/app/node_modules (uuid, nodemailer: version conflicts) would not resolve without this
ENV NODE_PATH=/app/services/app/node_modules

# The whole build tree (incl. dev dependencies) is kept on purpose: the prisma CLI runs
# `migrate deploy` from this image, and workspace-nested node_modules stay where Node expects them
COPY --from=build --chown=node:node /app /app

USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/app/src/index.js"]
