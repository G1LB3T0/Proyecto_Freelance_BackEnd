# Etapa de construcción
FROM node:18-alpine as builder

# Crear usuario no root para mejor seguridad
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias usando npm install en lugar de npm ci
RUN npm install

# Copiar el código fuente
COPY . .

# Cambiar la propiedad de los archivos al usuario no root
RUN chown -R nodeuser:nodegroup /app

# Etapa de producción
FROM node:18-alpine

# Crear el mismo usuario no root
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

WORKDIR /app

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder --chown=nodeuser:nodegroup /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodegroup /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodegroup /app/src ./src
COPY --from=builder --chown=nodeuser:nodegroup /app/index.js ./

# Cambiar al usuario no root
USER nodeuser

# Exponer el puerto que usa la aplicación
EXPOSE 3000

# Configurar variables de entorno para producción
ENV NODE_ENV=production

# Comando para iniciar la aplicación
CMD ["node", "index.js"]