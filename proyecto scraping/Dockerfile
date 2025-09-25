# Usa una imagen oficial de Node.js como base
FROM node:18

# Crea un directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Expone el puerto que usa tu app (ajústalo si es diferente)
EXPOSE 3000

# Comando para iniciar la app
CMD ["npm", "start"]
