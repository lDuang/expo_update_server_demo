FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json ./
RUN bun install --frozen-lockfile || bun install

COPY . .

FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
