FROM node:20-alpine

WORKDIR /app

COPY ./apps/server/package.json ./pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY ./apps/server .

RUN pnpm install
RUN pnpm build

COPY ./apps/server/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
