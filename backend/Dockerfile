FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .

FROM base AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .
RUN mkdir -p logs && chown nodeuser:nodejs logs

USER nodeuser
EXPOSE 5000
CMD ["node", "src/app.js"]
