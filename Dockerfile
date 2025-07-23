# Etapa de construcción
FROM node:18-alpine as builder

RUN apk add --no-cache openssl

RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

RUN chown -R nodeuser:nodegroup /app

# Etapa de producción
FROM node:18-alpine

RUN apk add --no-cache openssl

RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

COPY --from=builder --chown=nodeuser:nodegroup /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodegroup /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodegroup /app/src ./src
COPY --from=builder --chown=nodeuser:nodegroup /app/tests ./tests
COPY --from=builder --chown=nodeuser:nodegroup /app/index.js ./
COPY --from=builder --chown=nodeuser:nodegroup /app/prisma ./prisma/
COPY --from=builder --chown=nodeuser:nodegroup /app/node_modules/.prisma ./node_modules/.prisma/

USER nodeuser

EXPOSE 3000

ENV NODE_ENV=production

CMD npx prisma generate && node index.js
