# Multi-stage build: build with pnpm then serve with nginx
FROM node:20-alpine AS builder

WORKDIR /app

# copy repo root workspace files so pnpm can resolve workspace:* deps
COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./
COPY ./packages ./packages

# copy the web app sources
COPY ./apps/web ./apps/web

RUN corepack enable && corepack prepare pnpm@latest --activate

# install dependencies from the workspace root (ensures workspace:* packages are found)
RUN pnpm install

WORKDIR /app/apps/web
RUN pnpm build

# stage: nginx static server
FROM nginx:stable-alpine

# simple nginx config to support SPA routing
COPY ./apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;' "]
