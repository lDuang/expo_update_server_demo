FROM node:20-slim AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --frozen-lockfile || npm install

COPY . .

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

EXPOSE 3001

CMD ["npm", "run", "start"]
