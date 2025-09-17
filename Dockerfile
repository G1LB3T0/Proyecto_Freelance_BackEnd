FROM node:18

# Crear usuario y grupo (compatible con Ubuntu/Debian)
RUN groupadd -r nodegroup && useradd -r -g nodegroup nodeuser

WORKDIR /app

# Copiar archivos necesarios para instalación
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias como root
RUN npm install
RUN npx prisma generate

# Copiar el resto de archivos
COPY . .

# Cambiar permisos a nodeuser
RUN chown -R nodeuser:nodegroup /app

# Cambiar a usuario no-root
USER nodeuser

EXPOSE 3000

ENV NODE_ENV=development

CMD ["sh", "-c", "npx prisma generate && node index.js"]
