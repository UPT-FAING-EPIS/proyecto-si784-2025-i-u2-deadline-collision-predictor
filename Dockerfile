# Imagen base oficial de Node
FROM node:20

# Crear carpeta de trabajo
WORKDIR /usr/src/app

# Copiar archivos necesarios
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la app
CMD ["node", "server.js"]
