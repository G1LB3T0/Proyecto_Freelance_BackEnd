# Etapa de construcción
FROM node:18-alpine as builder

# Instalar OpenSSL y otras dependencias necesarias
RUN apk add --no-cache openssl

# Crear usuario no root para mejor seguridad
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias incluyendo Prisma
RUN npm install
RUN npx prisma generate

# Copiar el código fuente
COPY . .

# Cambiar la propiedad de los archivos al usuario no root
RUN chown -R nodeuser:nodegroup /app

# Etapa de producción
FROM node:18-alpine

# Instalar OpenSSL y otras dependencias necesarias
RUN apk add --no-cache openssl

# Crear el mismo usuario no root
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder --chown=nodeuser:nodegroup /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodegroup /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodegroup /app/src ./src
COPY --from=builder --chown=nodeuser:nodegroup /app/index.js ./
COPY --from=builder --chown=nodeuser:nodegroup /app/prisma ./prisma/
COPY --from=builder --chown=nodeuser:nodegroup /app/node_modules/.prisma ./node_modules/.prisma/

# Cambiar al usuario no root
USER nodeuser

# Exponer el puerto que usa la aplicación
EXPOSE 3000

# Configurar variables de entorno para producción
ENV NODE_ENV=production

# Generar el cliente Prisma y luego iniciar la aplicación
CMD npx prisma generate && node index.js