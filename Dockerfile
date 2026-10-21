FROM oven/bun:1.3.14

WORKDIR /app

# The deployment host injects secrets at runtime; never bake the local .env into the image.
COPY . .
RUN bun install --frozen-lockfile && bun run --cwd packages/web build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "packages/web/src/__server.ts"]